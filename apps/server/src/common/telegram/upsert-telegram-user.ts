import { UnauthorizedException } from '@nestjs/common'

import { Prisma, User } from '@/generated/prisma/client'
import { PrismaService } from 'prisma/prisma.service'

import { TelegramWidgetAuthError, TelegramWidgetPayload, verifyTelegramWidgetAuth } from './verify-widget-auth'

// Данные виджета считаем валидными сутки — дольше держать форму открытой без переподписи смысла нет
export const WIDGET_AUTH_MAX_AGE_SECONDS = 24 * 60 * 60

/**
 * Проверяет подпись Telegram Login Widget и upsert'ит пользователя по telegramId.
 *
 * Единственная точка правды для входа через Telegram Login Widget — используется
 * обменом на JWT (TelegramAuthService.loginWithWidget).
 *
 * @throws UnauthorizedException при невалидной/устаревшей подписи или деактивированном аккаунте
 */
export async function upsertTelegramUserFromWidget(
  prisma: PrismaService,
  payload: TelegramWidgetPayload,
  botToken: string,
): Promise<User> {
  try {
    verifyTelegramWidgetAuth(payload, botToken, { maxAgeSeconds: WIDGET_AUTH_MAX_AGE_SECONDS })
  } catch (e) {
    if (e instanceof TelegramWidgetAuthError) {
      throw new UnauthorizedException(e.message)
    }
    throw e
  }

  const telegramId = String(payload.id)
  const telegramData = payload as unknown as Prisma.InputJsonValue

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: { telegramData },
    create: { telegramId, telegramData },
  })

  if (!user.active) {
    throw new UnauthorizedException('Аккаунт деактивирован')
  }

  return user
}
