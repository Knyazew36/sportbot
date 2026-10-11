import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  VK_INTEGRATION_OPTIONS,
  VK_LINK_TTL_MS,
  VK_LOG_EMOJI,
  VK_REF_PAYLOAD,
} from '../vk.constants';
import { VkIntegrationOptions } from '../vk.types';

import { buildVkStartLink } from './vk-deeplink.util';
import { VkTokenStore } from './vk-token-store';

/**
 * Привязка VK к уже залогиненному веб-аккаунту.
 *
 * 1. Веб (авторизован): start(userId) → ссылка https://vk.me/club<groupId>?ref=link_<token>.
 * 2. Пользователь открывает её в VK и жмёт «Начать» → бот спрашивает «Привязать VK к аккаунту <email>?».
 * 3. Подтверждение → VkBotUpdate забирает токен (consume) и зовёт VkAppAdapter.linkAccount.
 * 4. Веб видит vkId в профиле (поллинг /user/me) и закрывает модалку.
 *
 * Токен знает только веб-сессия, создавшая его. Но ссылку можно переслать: поэтому бот показывает,
 * к какому аккаунту идёт привязка, и ждёт явного подтверждения.
 */
@Injectable()
export class VkLinkService {
  private readonly logger = new Logger(`${VK_LOG_EMOJI} ${VkLinkService.name}`);
  private readonly store = new VkTokenStore<number>(VK_LINK_TTL_MS);

  constructor(
    @Inject(VK_INTEGRATION_OPTIONS)
    private readonly options: VkIntegrationOptions,
  ) {}

  // ── Веб ─────────────────────────────────────────────────────────────────

  public start(userId: number): { url: string; expiresAt: number } {
    const { token, expiresAt } = this.store.create(userId);
    this.logger.log(`Создана ссылка привязки для userId=${userId}`);
    return {
      url: buildVkStartLink(
        this.options.groupId,
        `${VK_REF_PAYLOAD.link}${token}`,
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

  public reject(token: string, vkId: number): void {
    const userId = this.store.consume(token);
    if (userId !== null) {
      this.logger.warn(
        `Привязка к userId=${userId} отклонена пользователем vkId=${vkId}`,
      );
    }
  }
}
