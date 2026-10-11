import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  MAX_INTEGRATION_OPTIONS,
  MAX_LINK_TTL_MS,
  MAX_LOG_EMOJI,
  MAX_START_PAYLOAD,
} from '../max.constants';
import { MaxIntegrationOptions } from '../max.types';

import { buildMaxStartLink } from './max-deeplink.util';
import { MaxTokenStore } from './max-token-store';

/**
 * Привязка MAX к уже залогиненному веб-аккаунту.
 *
 * 1. Веб (авторизован): start(userId) → ссылка https://max.ru/<bot>?start=link_<token>.
 * 2. Пользователь открывает её в MAX → бот спрашивает «Привязать MAX к аккаунту <email>?».
 * 3. Подтверждение → MaxBotUpdate забирает токен (consume) и зовёт MaxAppAdapter.linkAccount.
 * 4. Веб видит maxId в профиле (поллинг /user/me) и закрывает модалку.
 *
 * Токен знает только веб-сессия, создавшая его, — его предъявление из MAX доказывает, что это
 * один человек. Но ссылку можно переслать: поэтому бот показывает, к какому аккаунту идёт
 * привязка, и ждёт явного подтверждения (раньше привязка шла автоматически при открытии).
 */
@Injectable()
export class MaxLinkService {
  private readonly logger = new Logger(
    `${MAX_LOG_EMOJI} ${MaxLinkService.name}`,
  );
  private readonly store = new MaxTokenStore<number>(MAX_LINK_TTL_MS);

  constructor(
    @Inject(MAX_INTEGRATION_OPTIONS)
    private readonly options: MaxIntegrationOptions,
  ) {}

  // ── Веб ─────────────────────────────────────────────────────────────────

  public start(userId: number): { url: string; expiresAt: number } {
    const { token, expiresAt } = this.store.create(userId);
    this.logger.log(`Создана ссылка привязки для userId=${userId}`);
    return {
      url: buildMaxStartLink(
        this.options.botName,
        `${MAX_START_PAYLOAD.link}${token}`,
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

  public reject(token: string, maxId: number): void {
    const userId = this.store.consume(token);
    if (userId !== null) {
      this.logger.warn(
        `Привязка к userId=${userId} отклонена пользователем maxId=${maxId}`,
      );
    }
  }
}
