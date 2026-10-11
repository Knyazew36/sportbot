import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { parse, validate } from '@telegram-apps/init-data-node';
import { Request } from 'express';

import { MessengerUser, MessengerUserStore } from '../../messenger.types';
import {
  isTelegramDialogOpen,
  withTelegramDialogStarted,
} from '../dialog/telegram-dialog.state';
import {
  TELEGRAM_INIT_DATA_TTL_SECONDS,
  TELEGRAM_INTEGRATION_OPTIONS,
  TELEGRAM_LOG_EMOJI,
} from '../telegram.constants';
import { TelegramIntegrationOptions } from '../telegram.types';

/**
 * Авторизация запросов из мини-приложения Telegram по initData.
 *
 * Telegram открывает мини-приложение с подписанной строкой initData (Telegram.WebApp.initData).
 * Фронт шлёт её в заголовке `Authorization: tma <initData>`, сервер проверяет подпись токеном бота
 * и по telegramId находит (или заводит) пользователя.
 *
 * Как подключить: добавить стратегию в общий guard проекта рядом с JWT-стратегией
 * (supports(req) → authenticate(req)). Интерфейс совпадает с AuthStrategy проекта по форме.
 */
@Injectable()
export class TelegramAuthStrategy {
  public readonly provider = 'telegram' as const;
  private readonly logger = new Logger(
    `${TELEGRAM_LOG_EMOJI} ${TelegramAuthStrategy.name}`,
  );
  private readonly ttlSeconds: number;

  constructor(
    @Inject(TELEGRAM_INTEGRATION_OPTIONS)
    private readonly options: TelegramIntegrationOptions,
    private readonly users: MessengerUserStore,
  ) {
    this.ttlSeconds =
      options.initDataTtlSeconds ?? TELEGRAM_INIT_DATA_TTL_SECONDS;
  }

  // ── Стратегия авторизации ───────────────────────────────────────────────

  public supports(req: Request): boolean {
    return String(req.header('authorization') || '').startsWith('tma ');
  }

  public async authenticate(req: Request): Promise<MessengerUser> {
    const initDataRaw = String(req.header('authorization') || '').slice(
      'tma '.length,
    );
    if (!initDataRaw) {
      throw new UnauthorizedException(
        'Нет initData: ожидается заголовок "tma <initData>"',
      );
    }

    const telegramUser = this.verifyAndParse(initDataRaw);
    const telegramId = String(telegramUser.id);
    const user = await this.users.upsertByExternalId('TELEGRAM', telegramId, {
      profile: telegramUser,
    });

    // allows_write_to_pm — пользователь уже разрешил боту писать (нажимал «Start» или дал доступ
    // из мини-приложения). Тогда уведомления доставимы и без нового /start — ставим маркер один раз
    if (!telegramUser.allows_write_to_pm || isTelegramDialogOpen(user.data))
      return user;
    this.logger.log(
      `allows_write_to_pm из initData — бот может писать: telegramId=${telegramId}, userId=${user.id}`,
    );
    return this.users.update(user.id, 'TELEGRAM', {
      data: withTelegramDialogStarted(user.data),
    });
  }

  /**
   * Проверка подписи и свежести initData и разбор пользователя. Публичный, чтобы любой код
   * проекта, получивший initData не через заголовок (WebSocket), проверял его здесь же.
   */
  public verifyAndParse(initDataRaw: string) {
    try {
      validate(initDataRaw, this.options.token, { expiresIn: this.ttlSeconds });
    } catch (err) {
      this.logger.warn(
        `initData не прошёл проверку: ${(err as Error).message}`,
      );
      throw new UnauthorizedException(
        `InitData validation failed: ${(err as Error).message}`,
      );
    }

    const initData = this.parse(initDataRaw);

    if (!initData.user?.id) {
      throw new UnauthorizedException('Telegram user not found');
    }
    return initData.user;
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private parse(initDataRaw: string) {
    try {
      return parse(initDataRaw);
    } catch (err) {
      this.logger.warn(`initData не разобран: ${(err as Error).message}`);
      throw new UnauthorizedException(
        `InitData parse failed: ${(err as Error).message}`,
      );
    }
  }
}
