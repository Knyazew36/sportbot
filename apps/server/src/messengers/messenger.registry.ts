import { Injectable, Logger } from '@nestjs/common';

import { MessengerChannel, MessengerChannelKey } from './messenger.types';

/**
 * Реестр подключённых мессенджеров. Модуль мессенджера регистрирует свою реализацию
 * MessengerChannel при старте (onModuleInit), потребители берут её по ключу канала.
 *
 * Почему реестр, а не прямой инжект MaxBotService/TelegramBotService: уведомлениям не нужно
 * знать, какие мессенджеры подключены. Подключили модуль VK — канал VK начал доставляться,
 * NotificationsService не меняется. Не подключили — канал тихо пропускается.
 */
@Injectable()
export class MessengerRegistry {
  private readonly logger = new Logger(`📨 ${MessengerRegistry.name}`);
  private readonly channels = new Map<MessengerChannelKey, MessengerChannel>();

  // ── Регистрация ─────────────────────────────────────────────────────────

  public register(channel: MessengerChannel): void {
    if (this.channels.has(channel.channel)) {
      this.logger.warn(
        `Канал ${channel.channel} зарегистрирован повторно — предыдущая реализация заменена`,
      );
    }
    this.channels.set(channel.channel, channel);
    this.logger.log(`Подключён мессенджер ${channel.channel}`);
  }

  // ── Доступ ──────────────────────────────────────────────────────────────

  /** Реализация канала или undefined, если канал не мессенджер (EMAIL/IN_APP) или модуль не подключён. */
  public get(channel: string): MessengerChannel | undefined {
    return this.channels.get(channel as MessengerChannelKey);
  }

  public list(): MessengerChannel[] {
    return [...this.channels.values()];
  }
}
