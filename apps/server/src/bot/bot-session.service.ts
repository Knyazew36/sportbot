import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { BotChannelKey, BotContext, BotSessionState } from './bot.types';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** Ожидание ввода в диалоге. В БД, а не в памяти: перезапуск сервера не ломает начатый ввод. */
@Injectable()
export class BotSessionService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Чтение ──────────────────────────────────────────────────────────────

  public async get(
    userId: number,
    channel: BotChannelKey,
  ): Promise<BotSessionState | null> {
    const session = await this.prisma.botSession.findFirst({
      where: { userId, channel, expiresAt: { gt: new Date() } },
    });
    if (!session) return null;
    return {
      state: session.state,
      data: (session.data ?? {}) as Record<string, any>,
    };
  }

  // ── Запись ──────────────────────────────────────────────────────────────

  public async set(
    ctx: Pick<BotContext, 'user' | 'channel'>,
    state: string,
    data: Record<string, any> = {},
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.prisma.botSession.upsert({
      where: {
        userId_channel: { userId: ctx.user.id, channel: ctx.channel },
      },
      update: { state, data, expiresAt },
      create: {
        userId: ctx.user.id,
        channel: ctx.channel,
        state,
        data,
        expiresAt,
      },
    });
  }

  public async clear(ctx: Pick<BotContext, 'user' | 'channel'>): Promise<void> {
    await this.prisma.botSession.deleteMany({
      where: { userId: ctx.user.id, channel: ctx.channel },
    });
  }
}
