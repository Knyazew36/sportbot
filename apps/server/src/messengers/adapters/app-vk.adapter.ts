import { Injectable } from '@nestjs/common';

import { MessengerUser } from '@/messengers';
import {
  VkAppAdapter,
  VkLinkButton,
  VkUserInfo,
  VkWebSession,
} from '@/messengers/vk';

import { AppMessengerAccountsService } from './app-messenger-accounts.service';
import { welcomeLinks, welcomeText } from './app-messenger-texts';

/**
 * Связка модуля VK (src/messengers/vk) с этим проектом: как здесь выдаются сессии,
 * сливаются аккаунты и как выглядит приветствие. Зеркало AppTelegramAdapter / AppMaxAdapter.
 *
 * Свои кнопки и команды бота проект добавляет здесь, переопределяя welcomeCallbacks / onCallback /
 * onMessage базового класса (по умолчанию они ничего не делают).
 */
@Injectable()
export class AppVkAdapter extends VkAppAdapter {
  constructor(private readonly accounts: AppMessengerAccountsService) {
    super();
  }

  // ── Сессии и аккаунты ───────────────────────────────────────────────────

  public async issueWebSession(user: MessengerUser): Promise<VkWebSession> {
    return this.accounts.issueWebSession(user);
  }

  public linkAccount(params: {
    targetUserId: number;
    vkUser: VkUserInfo;
    existingUser: MessengerUser | null;
  }): Promise<MessengerUser> {
    return this.accounts.linkAccount({
      channel: 'VK',
      targetUserId: params.targetUserId,
      externalId: String(params.vkUser.id),
      profile: params.vkUser,
      existingUser: params.existingUser,
    });
  }

  public describeAccount(userId: number): Promise<string | null> {
    return this.accounts.describeAccount(userId);
  }

  // ── Приветствие ─────────────────────────────────────────────────────────

  public welcomeText(): string {
    return welcomeText('VK');
  }

  public welcomeLinks(): VkLinkButton[] {
    return welcomeLinks();
  }
}
