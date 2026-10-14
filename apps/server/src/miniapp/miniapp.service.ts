import { Injectable, Logger, Optional } from '@nestjs/common';

import { isAdmin } from '@/bot/bot.types';
import { SportAccountService } from '@/bot/sport-account.service';
import { BotChannel, User } from '@/generated/prisma/client';
import { isMaxDialogOpen, MaxDialogService } from '@/messengers/max';
import {
  isTelegramDialogOpen,
  TelegramDialogService,
} from '@/messengers/telegram';

import { MiniappMeResponseDto } from './dto/miniapp-me.response.dto';
import { MiniappWriteAccessResponseDto } from './dto/miniapp-write-access.response.dto';

@Injectable()
export class MiniappService {
  private readonly logger = new Logger(`📱 ${MiniappService.name}`);

  constructor(
    private readonly accounts: SportAccountService,
    // Мессенджер без env не подключается — тогда и его сервиса нет
    @Optional() private readonly telegramDialog?: TelegramDialogService,
    @Optional() private readonly maxDialog?: MaxDialogService,
  ) {}

  // ── Вход ────────────────────────────────────────────────────────────────

  /** Первый запрос приложения: профиль (создаётся при первом входе), права и состояние первого запуска. */
  public async me(
    user: User,
    channel: BotChannel | null,
  ): Promise<MiniappMeResponseDto> {
    const profile = await this.accounts.ensureProfile(
      user,
      channel ?? 'TELEGRAM',
    );
    const result: MiniappMeResponseDto = {
      userId: user.id,
      displayName: profile.displayName,
      isAdmin: isAdmin(user),
      onboardingStep: profile.onboardingStep,
      onboarded: !!profile.onboardedAt,
      channel,
      canMessage: this.canMessage(user, channel),
    };
    this.logger.log(
      `Вход в приложение: userId=${user.id}, ${channel ?? 'не мессенджер'}, онбординг ${result.onboarded ? 'пройден' : `шаг ${result.onboardingStep}`}${result.isAdmin ? ', админ' : ''}${result.canMessage ? '' : ', писать нельзя'}`,
    );
    return result;
  }

  /**
   * Пользователь разрешил боту писать штатным запросом мессенджера (frontend-tz, 5.2).
   * Если разрешение на деле не дошло, первая же отправка получит 403 и снова закроет чат.
   */
  public async allowWriteAccess(
    user: User,
    channel: BotChannel | null,
  ): Promise<MiniappWriteAccessResponseDto> {
    if (channel === 'TELEGRAM' && user.telegramId && this.telegramDialog) {
      await this.telegramDialog.markStarted(user.telegramId);
    } else if (channel === 'MAX' && user.maxId && this.maxDialog) {
      await this.maxDialog.markStarted(user.maxId);
    } else {
      this.logger.warn(
        `Разрешение писать без мессенджера: userId=${user.id}, ${channel ?? '—'}`,
      );
      return { canMessage: false };
    }
    this.logger.log(`Разрешил писать: userId=${user.id}, ${channel}`);
    return { canMessage: true };
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private canMessage(user: User, channel: BotChannel | null): boolean {
    if (channel === 'TELEGRAM') return isTelegramDialogOpen(user.data);
    if (channel === 'MAX') return isMaxDialogOpen(user.data);
    // Не из мессенджера — баннер про разрешение не к месту
    return true;
  }
}
