import { Injectable } from '@nestjs/common';

import { MessengerUser } from '@/messengers';
import {
  MaxAppAdapter,
  MaxLinkButton,
  MaxUserInfo,
  MaxWebSession,
} from '@/messengers/max';

import { AppMessengerAccountsService } from './app-messenger-accounts.service';
import { welcomeLinks, welcomeText } from './app-messenger-texts';

/**
 * Связка модуля MAX (src/messengers/max) с этим проектом: как здесь выдаются сессии,
 * сливаются аккаунты и как выглядит приветствие. Зеркало AppTelegramAdapter / AppVkAdapter.
 *
 * Свои кнопки и команды бота проект добавляет здесь, переопределяя welcomeCallbacks / onCallback /
 * onMessage базового класса (по умолчанию они ничего не делают).
 */
@Injectable()
export class AppMaxAdapter extends MaxAppAdapter {
  constructor(private readonly accounts: AppMessengerAccountsService) {
    super();
  }

  // ── Сессии и аккаунты ───────────────────────────────────────────────────

  public async issueWebSession(user: MessengerUser): Promise<MaxWebSession> {
    return this.accounts.issueWebSession(user);
  }

  public linkAccount(params: {
    targetUserId: number;
    maxUser: MaxUserInfo;
    existingUser: MessengerUser | null;
  }): Promise<MessengerUser> {
    return this.accounts.linkAccount({
      channel: 'MAX',
      targetUserId: params.targetUserId,
      externalId: String(params.maxUser.id),
      profile: params.maxUser,
      existingUser: params.existingUser,
    });
  }

  public describeAccount(userId: number): Promise<string | null> {
    return this.accounts.describeAccount(userId);
  }

  // ── Приветствие ─────────────────────────────────────────────────────────

  public welcomeText(): string {
    return welcomeText('MAX');
  }

  public welcomeLinks(): MaxLinkButton[] {
    return welcomeLinks();
  }
}
