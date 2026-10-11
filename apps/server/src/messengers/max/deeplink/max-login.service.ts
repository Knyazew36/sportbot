import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import type { MessengerUser } from '../../messenger.types';
import { MaxAppAdapter } from '../max-app.adapter';
import {
  MAX_INTEGRATION_OPTIONS,
  MAX_LOG_EMOJI,
  MAX_LOGIN_TTL_MS,
  MAX_START_PAYLOAD,
} from '../max.constants';
import { MaxIntegrationOptions, MaxWebSession } from '../max.types';

import { buildMaxStartLink } from './max-deeplink.util';
import { MaxTokenStore } from './max-token-store';

/** isNewUser — аккаунт создан ботом в рамках этой же ссылки входа: фронт засчитывает это как регистрацию. */
type ConfirmedSession = MaxWebSession & { isNewUser: boolean };

type LoginEntry =
  | { status: 'pending' }
  | { status: 'confirmed'; session: ConfirmedSession }
  | { status: 'rejected' };

export type MaxLoginStatus =
  | { status: 'pending' }
  | ({ status: 'confirmed' } & ConfirmedSession)
  | { status: 'rejected' }
  | { status: 'expired' };

/**
 * Вход в веб-версию через MAX (без пароля).
 *
 * 1. Браузер: start() → ссылка https://max.ru/<bot>?start=login_<token>, показывается QR.
 * 2. Пользователь открывает ссылку в MAX → бот получает bot_started и спрашивает кнопками
 *    «Войти в браузере? Подтвердить / Отклонить» (MaxBotUpdate).
 * 3. Подтверждение → confirm(): адаптер проекта выдаёт сессию, она лежит под токеном.
 * 4. Браузер поллит status() и один раз забирает сессию.
 *
 * Почему подтверждение кнопкой обязательно: раньше вход подтверждался автоматически при
 * открытии ссылки. Тогда злоумышленник мог прислать жертве свою ссылку входа и получить
 * сессию жертвы в своём браузере. Теперь без явного «Подтвердить» сессия не выдаётся.
 */
@Injectable()
export class MaxLoginService {
  private readonly logger = new Logger(
    `${MAX_LOG_EMOJI} ${MaxLoginService.name}`,
  );
  private readonly store = new MaxTokenStore<LoginEntry>(MAX_LOGIN_TTL_MS);

  constructor(
    @Inject(MAX_INTEGRATION_OPTIONS)
    private readonly options: MaxIntegrationOptions,
    private readonly adapter: MaxAppAdapter,
  ) {}

  // ── Браузер ─────────────────────────────────────────────────────────────

  public start(): { token: string; url: string; expiresAt: number } {
    const { token, expiresAt } = this.store.create({ status: 'pending' });
    const url = buildMaxStartLink(
      this.options.botName,
      `${MAX_START_PAYLOAD.login}${token}`,
    );
    this.logger.log(
      `Создана ссылка входа, истекает ${new Date(expiresAt).toISOString()}`,
    );
    return { token, url, expiresAt };
  }

  /** Подтверждённую или отклонённую запись отдаём один раз и удаляем — сессию нельзя забрать повторно. */
  public status(token: string): MaxLoginStatus {
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
    const isNewUser = Date.now() - user.createdAt.getTime() <= MAX_LOGIN_TTL_MS;
    this.store.update(token, {
      status: 'confirmed',
      session: { ...session, isNewUser },
    });
    this.logger.log(
      `Вход подтверждён: userId=${user.id}, maxId=${user.maxId}, isNewUser=${isNewUser}`,
    );
  }

  public reject(token: string, maxId: number): void {
    if (this.store.update(token, { status: 'rejected' })) {
      this.logger.warn(`Вход отклонён пользователем maxId=${maxId}`);
    }
  }
}
