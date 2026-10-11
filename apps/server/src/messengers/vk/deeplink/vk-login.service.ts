import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import type { MessengerUser } from '../../messenger.types';
import { VkAppAdapter } from '../vk-app.adapter';
import {
  VK_INTEGRATION_OPTIONS,
  VK_LOG_EMOJI,
  VK_LOGIN_TTL_MS,
  VK_REF_PAYLOAD,
} from '../vk.constants';
import { VkIntegrationOptions, VkWebSession } from '../vk.types';

import { buildVkStartLink } from './vk-deeplink.util';
import { VkTokenStore } from './vk-token-store';

/** isNewUser — аккаунт создан ботом в рамках этой же ссылки входа: фронт засчитывает это как регистрацию. */
type ConfirmedSession = VkWebSession & { isNewUser: boolean };

type LoginEntry =
  | { status: 'pending' }
  | { status: 'confirmed'; session: ConfirmedSession }
  | { status: 'rejected' };

export type VkLoginStatus =
  | { status: 'pending' }
  | ({ status: 'confirmed' } & ConfirmedSession)
  | { status: 'rejected' }
  | { status: 'expired' };

/**
 * Вход в веб-версию через VK (без пароля).
 *
 * 1. Браузер: start() → ссылка https://vk.me/club<groupId>?ref=login_<token>, показывается QR.
 * 2. Пользователь открывает ссылку в VK и жмёт «Начать» → бот получает ref и спрашивает кнопками
 *    «Войти в браузере? Подтвердить / Отклонить» (VkBotUpdate).
 * 3. Подтверждение → confirm(): адаптер проекта выдаёт сессию, она лежит под токеном.
 * 4. Браузер поллит status() и один раз забирает сессию.
 *
 * Подтверждение кнопкой обязательно: без него злоумышленник мог бы прислать жертве свою ссылку
 * входа и получить сессию жертвы в своём браузере.
 */
@Injectable()
export class VkLoginService {
  private readonly logger = new Logger(
    `${VK_LOG_EMOJI} ${VkLoginService.name}`,
  );
  private readonly store = new VkTokenStore<LoginEntry>(VK_LOGIN_TTL_MS);

  constructor(
    @Inject(VK_INTEGRATION_OPTIONS)
    private readonly options: VkIntegrationOptions,
    private readonly adapter: VkAppAdapter,
  ) {}

  // ── Браузер ─────────────────────────────────────────────────────────────

  public start(): { token: string; url: string; expiresAt: number } {
    const { token, expiresAt } = this.store.create({ status: 'pending' });
    const url = buildVkStartLink(
      this.options.groupId,
      `${VK_REF_PAYLOAD.login}${token}`,
    );
    this.logger.log(
      `Создана ссылка входа, истекает ${new Date(expiresAt).toISOString()}`,
    );
    return { token, url, expiresAt };
  }

  /** Подтверждённую или отклонённую запись отдаём один раз и удаляем — сессию нельзя забрать повторно. */
  public status(token: string): VkLoginStatus {
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
    const isNewUser = Date.now() - user.createdAt.getTime() <= VK_LOGIN_TTL_MS;
    this.store.update(token, {
      status: 'confirmed',
      session: { ...session, isNewUser },
    });
    this.logger.log(
      `Вход подтверждён: userId=${user.id}, vkId=${user.vkId}, isNewUser=${isNewUser}`,
    );
  }

  public reject(token: string, vkId: number): void {
    if (this.store.update(token, { status: 'rejected' })) {
      this.logger.warn(`Вход отклонён пользователем vkId=${vkId}`);
    }
  }
}
