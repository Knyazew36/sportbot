import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Prisma, User } from '@/generated/prisma/client';
import { MessengerChannelKey, MessengerUser } from '@/messengers';
import { UserService } from '@/user/user.service';
import { PrismaService } from 'prisma/prisma.service';

import { LINK_ERRORS } from './app-messenger-texts';

const COLUMNS = {
  TELEGRAM: { id: 'telegramId', profile: 'telegramData' },
  MAX: { id: 'maxId', profile: 'maxData' },
  VK: { id: 'vkId', profile: 'vkData' },
} as const;

/**
 * Общая для всех мессенджеров проектная логика аккаунтов: какую сессию выдать после входа через
 * бота, как привязать аккаунт мессенджера к веб-аккаунту и как назвать аккаунт в чате.
 * Адаптеры каналов (AppTelegramAdapter / AppMaxAdapter / AppVkAdapter) делегируют сюда.
 */
@Injectable()
export class AppMessengerAccountsService {
  private readonly logger = new Logger(
    `📨 ${AppMessengerAccountsService.name}`,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  // ── Сессии ──────────────────────────────────────────────────────────────

  /** Обычный веб-Bearer, как у email-входа: JwtAuthStrategy принимает его без оглядки на мессенджер. */
  public issueWebSession(user: MessengerUser): {
    accessToken: string;
    user: { id: number; email: string | null };
  } {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      provider: 'email',
      // PrismaMessengerUserStore отдаёт полные строки User, поэтому версия токена здесь есть
      ver: (user as unknown as User).tokenVersion ?? 0,
    });
    this.logger.log(
      `Выдана веб-сессия после входа через бота: userId=${user.id}`,
    );
    return { accessToken, user: { id: user.id, email: user.email } };
  }

  // ── Привязка ────────────────────────────────────────────────────────────

  public async linkAccount(params: {
    channel: MessengerChannelKey;
    targetUserId: number;
    externalId: string;
    profile: object;
    existingUser: MessengerUser | null;
  }): Promise<User> {
    const { channel, targetUserId, externalId, profile, existingUser } = params;

    // У аккаунта мессенджера уже есть своя строка (мини-приложение/чат) — сливаем её в веб-аккаунт:
    // членства и сам идентификатор переезжают в target
    if (existingUser) {
      return this.userService.mergeMessengerAccountInto(
        existingUser.id,
        targetUserId,
      );
    }

    const column = COLUMNS[channel];
    try {
      // null в where — не перезаписываем молча чужой аккаунт мессенджера, уже привязанный к target
      const linked = await this.prisma.user.update({
        where: {
          id: targetUserId,
          OR: [{ [column.id]: null }, { [column.id]: externalId }],
        },
        data: {
          [column.id]: externalId,
          [column.profile]: profile,
        },
      });
      this.logger.log(`Привязан ${channel}: userId=${targetUserId}`);
      return linked;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new Error(LINK_ERRORS.targetTaken(channel));
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new Error(LINK_ERRORS.accountTaken(channel));
      }
      throw error;
    }
  }

  /** Как назвать веб-аккаунт в вопросе «Привязать … к аккаунту …?». */
  public async describeAccount(userId: number): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true, name: true },
    });
    return user?.email ?? user?.phone ?? user?.name ?? null;
  }
}
