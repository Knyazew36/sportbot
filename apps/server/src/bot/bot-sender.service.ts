import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { User } from '@/generated/prisma/client';
import {
  MessengerMessage,
  MessengerRegistry,
  MessengerSendResult,
} from '@/messengers';

import { adminConfigured, BotChannelKey, isAdmin } from './bot.types';

/** Не больше 20 сообщений в секунду на мессенджер. */
const CHANNEL_INTERVAL_MS = 50;
/** Не больше одного сообщения в секунду в один чат. */
const CHAT_INTERVAL_MS = 1000;
const MAX_ATTEMPTS = 3;

const CHANNELS: BotChannelKey[] = ['TELEGRAM', 'MAX'];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Всё исходящее бота: очередь в памяти с лимитами платформ и повтором на 429.
 * Рассчитана на один экземпляр сервера (раздел 31 ТЗ).
 */
@Injectable()
export class BotSender {
  private readonly logger = new Logger(`📤 ${BotSender.name}`);
  /** Хвост очереди каждого мессенджера: следующая отправка встаёт за предыдущей. */
  private readonly tails = new Map<BotChannelKey, Promise<unknown>>();
  private readonly channelFreeAt = new Map<BotChannelKey, number>();
  private readonly chatFreeAt = new Map<string, number>();

  constructor(
    private readonly registry: MessengerRegistry,
    private readonly prisma: PrismaService,
  ) {}

  // ── Отправка ────────────────────────────────────────────────────────────

  /** Ответ в конкретный мессенджер (туда, где пользователь нажал кнопку). Бросает при отказе. */
  public sendVia(
    channel: BotChannelKey,
    user: User,
    message: MessengerMessage,
  ): Promise<MessengerSendResult> {
    const job = () => this.deliver(channel, user, message);
    const tail = (this.tails.get(channel) ?? Promise.resolve()).then(job, job);
    this.tails.set(
      channel,
      tail.catch(() => undefined),
    );
    return tail;
  }

  /**
   * Сообщение от бота по его инициативе: во все привязанные мессенджеры, куда можно доставить.
   * Не бросает: недоставка пишется в лог. @returns ушло ли хотя бы в один мессенджер.
   */
  public async send(user: User, message: MessengerMessage): Promise<boolean> {
    let delivered = false;
    for (const channel of CHANNELS) {
      const messenger = this.registry.get(channel);
      if (!messenger?.canDeliver(user)) continue;
      try {
        await this.sendVia(channel, user, message);
        delivered = true;
      } catch (error) {
        this.logger.warn(
          `Не доставлено userId=${user.id} в ${channel}: ${(error as Error).message}`,
        );
      }
    }
    if (!delivered)
      this.logger.debug(
        `Некуда писать userId=${user.id} — сообщение пропущено`,
      );
    return delivered;
  }

  public async sendToUserId(
    userId: number,
    message: MessengerMessage,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    return this.send(user, message);
  }

  /** Администраторам: заявки и жалобы приходят во все их мессенджеры. */
  public async sendToAdmins(message: MessengerMessage): Promise<void> {
    if (!adminConfigured()) {
      this.logger.warn(
        'Администратор не задан (ADMIN_TELEGRAM_USERNAME / ADMIN_TELEGRAM_ID / ADMIN_MAX_USERNAME / ADMIN_MAX_ID) — сообщение некому отправить',
      );
      return;
    }
    // Ник лежит в JSON-профиле и сверяется без учёта регистра — проще отобрать в коде:
    // пользователей десятки
    const users = await this.prisma.user.findMany({
      where: { OR: [{ telegramId: { not: null } }, { maxId: { not: null } }] },
    });
    const admins = users.filter(isAdmin);
    if (!admins.length)
      this.logger.warn(
        'Администратор ещё не запускал бота — сообщение не ушло',
      );
    for (const admin of admins) await this.send(admin, message);
  }

  // ── Очередь ─────────────────────────────────────────────────────────────

  private async deliver(
    channel: BotChannelKey,
    user: User,
    message: MessengerMessage,
  ): Promise<MessengerSendResult> {
    const messenger = this.registry.get(channel);
    if (!messenger) throw new Error(`Мессенджер ${channel} не подключён`);
    const chatKey = `${channel}:${channel === 'TELEGRAM' ? user.telegramId : user.maxId}`;

    for (let attempt = 1; ; attempt++) {
      const wait =
        Math.max(
          this.channelFreeAt.get(channel) ?? 0,
          this.chatFreeAt.get(chatKey) ?? 0,
        ) - Date.now();
      if (wait > 0) await sleep(wait);
      this.channelFreeAt.set(channel, Date.now() + CHANNEL_INTERVAL_MS);
      this.chatFreeAt.set(chatKey, Date.now() + CHAT_INTERVAL_MS);
      try {
        return await messenger.send(user, message);
      } catch (error) {
        const text = (error as Error).message ?? '';
        const tooMany = /429|too many requests|too\.many\.requests/i.test(text);
        if (!tooMany || attempt >= MAX_ATTEMPTS) throw error;
        const retryAfter = Number(/retry after (\d+)/i.exec(text)?.[1] ?? 1);
        this.logger.warn(
          `429 от ${channel}, userId=${user.id}: повтор через ${retryAfter} с (попытка ${attempt})`,
        );
        await sleep(retryAfter * 1000);
      }
    }
  }
}
