import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  TELEGRAM_INTEGRATION_OPTIONS,
  TELEGRAM_LINK_TTL_MS,
  TELEGRAM_LOG_EMOJI,
  TELEGRAM_START_PAYLOAD,
} from '../telegram.constants';
import { TelegramIntegrationOptions } from '../telegram.types';

import { buildTelegramStartLink } from './telegram-deeplink.util';
import { TelegramTokenStore } from './telegram-token-store';

/**
 * Привязка Telegram к уже залогиненному веб-аккаунту.
 *
 * 1. Веб (авторизован): start(userId) → ссылка https://t.me/<bot>?start=link_<token>.
 * 2. Пользователь открывает её в Telegram → бот спрашивает «Привязать Telegram к аккаунту <email>?».
 * 3. Подтверждение → TelegramBotUpdate забирает токен (consume) и зовёт TelegramAppAdapter.linkAccount.
 * 4. Веб видит telegramId в профиле (поллинг /user/me) и закрывает модалку.
 *
 * Токен знает только веб-сессия, создавшая его. Но ссылку можно переслать: поэтому бот показывает,
 * к какому аккаунту идёт привязка, и ждёт явного подтверждения.
 */
@Injectable()
export class TelegramLinkService {
  private readonly logger = new Logger(
    `${TELEGRAM_LOG_EMOJI} ${TelegramLinkService.name}`,
  );
  private readonly store = new TelegramTokenStore<number>(TELEGRAM_LINK_TTL_MS);

  constructor(
    @Inject(TELEGRAM_INTEGRATION_OPTIONS)
    private readonly options: TelegramIntegrationOptions,
  ) {}

  // ── Веб ─────────────────────────────────────────────────────────────────

  public start(userId: number): { url: string; expiresAt: number } {
    const { token, expiresAt } = this.store.create(userId);
    this.logger.log(`Создана ссылка привязки для userId=${userId}`);
    return {
      url: buildTelegramStartLink(
        this.options.botName,
        `${TELEGRAM_START_PAYLOAD.link}${token}`,
      ),
      expiresAt,
    };
  }

  // ── Бот ─────────────────────────────────────────────────────────────────

  /** id веб-аккаунта, к которому ведёт ссылка, без траты токена. null — ссылка устарела. */
  public peek(token: string): number | null {
    return this.store.peek(token);
  }

  /** Одноразово: после подтверждения ссылка больше не работает. */
  public consume(token: string): number | null {
    return this.store.consume(token);
  }

  public reject(token: string, telegramId: number): void {
    const userId = this.store.consume(token);
    if (userId !== null) {
      this.logger.warn(
        `Привязка к userId=${userId} отклонена пользователем telegramId=${telegramId}`,
      );
    }
  }
}
