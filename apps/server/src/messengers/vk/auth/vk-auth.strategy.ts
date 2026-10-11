import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { MessengerUser, MessengerUserStore } from '../../messenger.types';
import { VkBotService } from '../bot/vk-bot.service';
import {
  VK_INTEGRATION_OPTIONS,
  VK_LAUNCH_PARAMS_TTL_SECONDS,
  VK_LOG_EMOJI,
} from '../vk.constants';
import { VkIntegrationOptions } from '../vk.types';

import {
  VerifiedLaunchParams,
  verifyVkLaunchParams,
  VkLaunchParamsError,
} from './vk-launch-params';

const AUTH_SCHEME = 'vk ';

/**
 * Авторизация запросов из мини-приложения VK по launch-параметрам.
 *
 * VK открывает мини-приложение с подписанными vk_*-параметрами в адресе (window.location.search).
 * Фронт шлёт их в заголовке `Authorization: vk <launchParams>`, сервер проверяет подпись защищённым
 * ключом приложения и по vkId находит (или заводит) пользователя.
 *
 * Как подключить: добавить стратегию в общий guard проекта рядом с JWT-стратегией
 * (supports(req) → authenticate(req)). Интерфейс совпадает с AuthStrategy проекта по форме.
 */
@Injectable()
export class VkAuthStrategy {
  public readonly provider = 'vk' as const;
  private readonly logger = new Logger(
    `${VK_LOG_EMOJI} ${VkAuthStrategy.name}`,
  );
  private readonly ttlSeconds: number;

  constructor(
    @Inject(VK_INTEGRATION_OPTIONS)
    private readonly options: VkIntegrationOptions,
    private readonly users: MessengerUserStore,
    private readonly botService: VkBotService,
  ) {
    this.ttlSeconds =
      options.launchParamsTtlSeconds ?? VK_LAUNCH_PARAMS_TTL_SECONDS;
  }

  // ── Стратегия авторизации ───────────────────────────────────────────────

  public supports(req: Request): boolean {
    return String(req.header('authorization') || '').startsWith(AUTH_SCHEME);
  }

  public async authenticate(req: Request): Promise<MessengerUser> {
    const launchParams = String(req.header('authorization') || '').slice(
      AUTH_SCHEME.length,
    );
    if (!launchParams) {
      throw new UnauthorizedException(
        'Нет launch-параметров: ожидается заголовок "vk <launchParams>"',
      );
    }

    const { vkId } = this.verify(launchParams);
    const user = await this.users.upsertByExternalId('VK', String(vkId), {});
    if (user.vkData) return user;

    // Launch-параметры не несут имени и фото, в отличие от initData Telegram/MAX. Профиль тянем
    // из VK один раз — пока его нет (первый заход), дальше его обновляет бот
    const profile = await this.botService.fetchProfile(vkId);
    if (!profile) return user;
    this.logger.log(`Профиль VK сохранён: vkId=${vkId}, userId=${user.id}`);
    return this.users.update(user.id, 'VK', {
      profile: profile as unknown as Record<string, unknown>,
    });
  }

  /**
   * Проверка подписи и свежести launch-параметров. Публичный, чтобы любой код проекта, получивший
   * их не через заголовок (WebSocket), проверял их здесь же.
   */
  public verify(launchParams: string): VerifiedLaunchParams {
    if (!this.options.appSecret) {
      this.logger.warn(
        'Запрос из мини-приложения VK, но VK_APP_SECRET не задан — авторизация невозможна',
      );
      throw new UnauthorizedException(
        'Мини-приложение VK не настроено на сервере',
      );
    }
    try {
      return verifyVkLaunchParams(launchParams, this.options.appSecret, {
        maxAgeSeconds: this.ttlSeconds,
      });
    } catch (error) {
      if (error instanceof VkLaunchParamsError) {
        this.logger.warn(
          `Launch-параметры не прошли проверку: ${error.message}`,
        );
        throw new UnauthorizedException(
          `VK launch params validation failed: ${error.message}`,
        );
      }
      throw error;
    }
  }
}
