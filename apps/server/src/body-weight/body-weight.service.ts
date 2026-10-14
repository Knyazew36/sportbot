import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { BotChannelKey, btn, localToday, msg, hint } from '@/bot';
import {
  SportProfile,
  User,
  WeightAskFrequency,
} from '@/generated/prisma/client';
import { MessengerMessage } from '@/messengers';

/** Через сколько дней бот спрашивает вес снова. */
export const WEIGHT_ASK_PERIOD_DAYS: Record<WeightAskFrequency, number> = {
  OFF: Infinity,
  WEEKLY: 7,
  BIWEEKLY: 14,
  MONTHLY: 30,
};

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class BodyWeightService {
  private readonly logger = new Logger(`⚖️ ${BodyWeightService.name}`);

  constructor(private readonly prisma: PrismaService) {}

  // ── Чтение ──────────────────────────────────────────────────────────────

  public async recent(userId: number, take = 7) {
    return this.prisma.bodyWeight.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take,
    });
  }

  // ── Запись ──────────────────────────────────────────────────────────────

  /** Вес из ввода «78», «78.5», «78,5 кг». Повторный ввод за день заменяет значение. */
  public async record(profile: SportProfile, input: string): Promise<number> {
    const match = /^\s*(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:кг)?\s*$/i.exec(input);
    const value = match ? Number(match[1].replace(',', '.')) : NaN;
    if (!(value >= 20 && value <= 400))
      throw new BadRequestException(
        'Не понял вес. Напиши число в килограммах, например «78.5».',
      );
    const date = localToday(profile.timeZone);
    await this.prisma.bodyWeight.upsert({
      where: { userId_date: { userId: profile.userId, date } },
      update: { value },
      create: { userId: profile.userId, date, value },
    });
    // Само значение — приватные данные, в лог не пишем
    this.logger.log(`Вес тела записан: userId=${profile.userId}`);
    return value;
  }

  /** Вес из формы приложения; повторный ввод за день заменяет значение. */
  public async recordByUser(
    userId: number,
    value: number,
  ): Promise<{ date: string; value: number }> {
    const profile = await this.prisma.sportProfile.findUniqueOrThrow({
      where: { userId },
    });
    const date = localToday(profile.timeZone);
    await this.prisma.bodyWeight.upsert({
      where: { userId_date: { userId, date } },
      update: { value },
      create: { userId, date, value },
    });
    this.logger.log(`Вес тела записан из приложения: userId=${userId}`);
    return { date: date.toISOString().slice(0, 10), value };
  }

  // ── Периодический вопрос ────────────────────────────────────────────────

  /**
   * Отметить, что вес спросили сегодня, и поставить ожидание ввода во всех мессенджерах
   * пользователя. @returns false — сегодня уже спрашивали.
   */
  public async markAsked(
    user: User,
    profile: SportProfile,
    today: Date,
  ): Promise<boolean> {
    const { count } = await this.prisma.sportProfile.updateMany({
      where: {
        userId: user.id,
        OR: [{ weightAskedOn: null }, { weightAskedOn: { lt: today } }],
      },
      data: { weightAskedOn: today },
    });
    if (!count) return false;
    const channels: BotChannelKey[] = [
      ...(user.telegramId ? (['TELEGRAM'] as const) : []),
      ...(user.maxId ? (['MAX'] as const) : []),
    ];
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    for (const channel of channels)
      await this.prisma.botSession.upsert({
        where: { userId_channel: { userId: user.id, channel } },
        update: { state: 'bw.value', data: {}, expiresAt },
        create: { userId: user.id, channel, state: 'bw.value', expiresAt },
      });
    this.logger.log(`Вопрос о весе задан: userId=${profile.userId}`);
    return true;
  }

  public askMessage(): MessengerMessage {
    return msg(
      `Сколько сейчас весишь?\n${hint('Напиши число в килограммах, например «78.5».')}`,
      [[btn('Пропустить', 'bw:skip')]],
    );
  }
}
