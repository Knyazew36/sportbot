import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { BotChannel, SportProfile, User } from '@/generated/prisma/client';

/**
 * Учётная запись спортбота: блокировка и спортивный профиль.
 * Общая для бота (BotRouter) и Mini App (MiniappService): человек один, вход любой.
 */
@Injectable()
export class SportAccountService {
  private readonly logger = new Logger(`🤖 ${SportAccountService.name}`);

  constructor(private readonly prisma: PrismaService) {}

  // ── Блокировка ──────────────────────────────────────────────────────────

  /** Заблокирован ли аккаунт мессенджера, из которого пришёл пользователь. */
  public async isBlocked(
    user: Pick<User, 'telegramId' | 'maxId'>,
    channel: BotChannel,
  ): Promise<boolean> {
    const externalId = channel === 'TELEGRAM' ? user.telegramId : user.maxId;
    if (!externalId) return false;
    const blocked = await this.prisma.blockedAccount.findUnique({
      where: { channel_externalId: { channel, externalId } },
      select: { id: true },
    });
    return !!blocked;
  }

  // ── Профиль ─────────────────────────────────────────────────────────────

  /** Профиль для запросов Mini App: создаётся первым запросом приложения (miniapp/me). */
  public async profile(userId: number): Promise<SportProfile> {
    const profile = await this.prisma.sportProfile.findUnique({
      where: { userId },
    });
    if (!profile)
      throw new NotFoundException(
        'Профиль не найден — открой приложение заново.',
      );
    return profile;
  }

  /** Спортивный профиль; при первом входе (из бота или приложения) создаётся с именем из мессенджера. */
  public async ensureProfile(
    user: Pick<User, 'id' | 'name' | 'telegramData' | 'maxData'> & {
      sportProfile?: SportProfile | null;
    },
    channel: BotChannel,
  ): Promise<SportProfile> {
    if (user.sportProfile) return user.sportProfile;
    const tg = user.telegramData as { first_name?: string } | null;
    const max = user.maxData as { name?: string; first_name?: string } | null;
    const displayName =
      user.name ||
      (channel === 'TELEGRAM'
        ? tg?.first_name
        : (max?.first_name ?? max?.name)) ||
      tg?.first_name ||
      max?.name ||
      'Спортсмен';
    const profile = await this.prisma.sportProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        displayName: displayName.slice(0, 64),
        trainingDays: [1, 3, 5],
      },
    });
    this.logger.debug(`Спортивный профиль на месте, userId=${user.id}`);
    return profile;
  }
}
