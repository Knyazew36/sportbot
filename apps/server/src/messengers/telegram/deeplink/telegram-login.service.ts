import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import type { MessengerUser } from '../../messenger.types';
import { TelegramAppAdapter } from '../telegram-app.adapter';
import {
  TELEGRAM_INTEGRATION_OPTIONS,
  TELEGRAM_LOG_EMOJI,
  TELEGRAM_LOGIN_TTL_MS,
  TELEGRAM_START_PAYLOAD,
} from '../telegram.constants';
import {
  TelegramIntegrationOptions,
  TelegramWebSession,
} from '../telegram.types';

import { buildTelegramStartLink } from './telegram-deeplink.util';
import { TelegramTokenStore } from './telegram-token-store';

/** isNewUser — аккаунт создан ботом в рамках этой же ссылки входа: фронт засчитывает это как регистрацию. */
type ConfirmedSession = TelegramWebSession & { isNewUser: boolean };

type LoginEntry =
  | { status: 'pending' }
  | { status: 'confirmed'; session: ConfirmedSession }
  | { status: 'rejected' };

export type TelegramLoginStatus =
  | { status: 'pending' }
  | ({ status: 'confirmed' } & ConfirmedSession)
  | { status: 'rejected' }
  | { status: 'expired' };

/**
 * Вход в веб-версию через Telegram (без пароля).
 *
 * 1. Браузер: start() → ссылка https://t.me/<bot>?start=login_<token>, показывается QR.
 * 2. Пользователь открывает ссылку в Telegram → бот получает /start и спрашивает кнопками
 *    «Войти в браузере? Подтвердить / Отклонить» (TelegramBotUpdate).
 * 3. Подтверждение → confirm(): адаптер проекта выдаёт сессию, она лежит под токеном.
 * 4. Браузер поллит status() и один раз забирает сессию.
 *
 * Подтверждение кнопкой обязательно: без него злоумышленник мог бы прислать жертве свою ссылку
 * входа и получить сессию жертвы в своём браузере.
 */
@Injectable()
export class TelegramLoginService {
  private readonly logger = new Logger(
    `${TELEGRAM_LOG_EMOJI} ${TelegramLoginService.name}`,
  );
  private readonly store = new TelegramTokenStore<LoginEntry>(
    TELEGRAM_LOGIN_TTL_MS,
  );

  constructor(
    @Inject(TELEGRAM_INTEGRATION_OPTIONS)
    private readonly options: TelegramIntegrationOptions,
    private readonly adapter: TelegramAppAdapter,
  ) {}

  // ── Браузер ─────────────────────────────────────────────────────────────

  public start(): { token: string; url: string; expiresAt: number } {
    const { token, expiresAt } = this.store.create({ status: 'pending' });
    const url = buildTelegramStartLink(
      this.options.botName,
      `${TELEGRAM_START_PAYLOAD.login}${token}`,
    );
    this.logger.log(
      `Создана ссылка входа, истекает ${new Date(expiresAt).toISOString()}`,
    );
    return { token, url, expiresAt };
  }

  /** Подтверждённую или отклонённую запись отдаём один раз и удаляем — сессию нельзя забрать повторно. */
  public status(token: string): TelegramLoginStatus {
    const entry = this.store.peek(token);
    if (!entry) return { status: 'expired' };
    if (entry.status === 'pending') return { status: 'pending' };

    this.store.consume(token);
    if (entry.status === 'rejected') return { status: 'rejected' };
    return { status: 'confirmed', ...entry.session };
  }

  // ── Бот ─────────────────────────────────────────────────────────────────

  /** Ждёт ли токен подтверждения — бот спрашивает только по живым ссылкам. */
  public isPending(token: string): boolean {
    return this.store.peek(token)?.status === 'pending';
  }

  public async confirm(token: string, user: MessengerUser): Promise<void> {
    if (!this.isPending(token)) {
      throw new BadRequestException('Ссылка входа недействительна или истекла');
    }
    const session = await this.adapter.issueWebSession(user);
    // Бот заводит аккаунт при первом /start по ссылке входа, поэтому «создан не раньше, чем живёт ссылка» = новый
    const isNewUser =
      Date.now() - user.createdAt.getTime() <= TELEGRAM_LOGIN_TTL_MS;
    this.store.update(token, {
      status: 'confirmed',
      session: { ...session, isNewUser },
    });
    this.logger.log(
      `Вход подтверждён: userId=${user.id}, telegramId=${user.telegramId}, isNewUser=${isNewUser}`,
    );
  }

  public reject(token: string, telegramId: number): void {
    if (this.store.update(token, { status: 'rejected' })) {
      this.logger.warn(`Вход отклонён пользователем telegramId=${telegramId}`);
    }
  }
}
