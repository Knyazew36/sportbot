import { UnauthorizedException } from '@nestjs/common';

import { Prisma, User } from '@/generated/prisma/client';
import { PrismaService } from 'prisma/prisma.service';

import {
  LaunchParamsError,
  VerifiedLaunchParams,
  verifyVkLaunchParams,
} from './verify-launch-params';

// launch-параметры считаем валидными сутки — дольше держать сессию без переоткрытия приложения смысла нет
export const LAUNCH_PARAMS_MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * Единственная точка правды для upsert'а пользователя по vkUserId: используется
 * и входом через launch-параметры VK Mini App, и входом через VK ID OAuth.
 *
 * @throws UnauthorizedException если аккаунт деактивирован
 */
export async function upsertVkUser(
  prisma: PrismaService,
  vkUserId: bigint,
  vkData: Prisma.InputJsonValue,
): Promise<User> {
  const user = await prisma.user.upsert({
    where: { vkUserId },
    update: { vkData },
    create: { vkUserId, vkData },
  });

  if (!user.active) {
    throw new UnauthorizedException('Аккаунт деактивирован');
  }

  return user;
}

/**
 * Проверяет подпись VK Mini App launch-параметров и upsert'ит пользователя по vkUserId.
 *
 * Используется обменом на JWT (VkAuthService.loginWithMiniApp) и per-request
 * стратегией (VkAuthStrategy).
 *
 * `profile` — имя/фото из VK Bridge (VKWebAppGetUserInfo), которых нет в самих
 * launch-параметрах; если передан, кладём его в vkData.profile — источник для
 * resolveAvatarUrl/resolveVkName на чтении, отдельных колонок под это не заводим.
 *
 * @throws UnauthorizedException при невалидной/устаревшей подписи или деактивированном аккаунте
 */
export async function upsertVkUserFromLaunchParams(
  prisma: PrismaService,
  launchParams: string,
  secret: string,
  profile?: object,
): Promise<User> {
  let verified: VerifiedLaunchParams;
  try {
    verified = verifyVkLaunchParams(launchParams, secret, {
      maxAgeSeconds: LAUNCH_PARAMS_MAX_AGE_SECONDS,
    });
  } catch (e) {
    if (e instanceof LaunchParamsError) {
      throw new UnauthorizedException(e.message);
    }
    throw e;
  }

  const vkData = (
    profile ? { ...verified.params, profile } : verified.params
  ) as Prisma.InputJsonValue;

  return upsertVkUser(prisma, BigInt(verified.vkUserId), vkData);
}
