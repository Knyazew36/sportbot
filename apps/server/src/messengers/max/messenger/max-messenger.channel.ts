import { Injectable, OnModuleInit } from '@nestjs/common';
import type { Context } from 'max-io';

import {
  MessengerButton,
  MessengerCallbackMessage,
  MessengerChannel,
  MessengerMessage,
  MessengerRegistry,
} from '../../index';

import type { MessengerUser } from '../../messenger.types';
import { MaxBotService } from '../bot/max-bot.service';
import { MaxDialogService } from '../dialog/max-dialog.service';

/**
 * MAX как реализация общего контракта мессенджеров (src/messengers). Через него идут уведомления:
 * NotificationsService берёт канал 'MAX' из MessengerRegistry и не знает про MaxBotService.
 * Регистрируется в реестре сам при старте модуля.
 */
@Injectable()
export class MaxMessengerChannel implements MessengerChannel, OnModuleInit {
  public readonly channel = 'MAX' as const;

  constructor(
    private readonly registry: MessengerRegistry,
    private readonly botService: MaxBotService,
    private readonly dialogService: MaxDialogService,
  ) {}

  public onModuleInit(): void {
    this.registry.register(this);
  }

  // ── Контракт MessengerChannel ───────────────────────────────────────────

  /** MAX привязан и чат с ботом открыт — иначе MAX ответит dialog.not.found. */
  public canDeliver(user: MessengerUser): boolean {
    return this.dialogService.canDeliver(user);
  }

  public async send(
    user: MessengerUser,
    message: MessengerMessage,
  ): Promise<void> {
    if (!user.maxId) throw new Error('У пользователя не привязан MAX');
    await this.botService.sendMessage(
      user.maxId,
      message.text,
      this.toExtra(message),
    );
  }

  // ── Ответ правкой сообщения ─────────────────────────────────────────────

  /** Сообщение с нажатой кнопкой (контекст message_callback из MaxAppAdapter.onCallback). */
  public callbackMessage(ctx: Context): MessengerCallbackMessage {
    return {
      channel: this.channel,
      // timestamp сообщения MAX — в миллисекундах
      sentAt: async () =>
        ctx.message?.timestamp ? new Date(ctx.message.timestamp) : null,
      edit: async (message) => {
        // Пустой attachments убирает старую клавиатуру — без поля MAX оставил бы прежние кнопки
        const result = await ctx.editMessage({
          text: message.text,
          attachments: this.toExtra(message)?.attachments ?? [],
        });
        // MAX может ответить 200 с success: false (сообщение старше 7 суток и т.п.) — для вызывающего это отказ
        if (!result.success) {
          const reason = 'message' in result ? result.message : undefined;
          throw new Error(
            `MAX: не удалось изменить сообщение: ${reason ?? 'без причины'}`,
          );
        }
      },
    };
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private toExtra(message: MessengerMessage) {
    return message.buttons?.length
      ? this.botService.keyboard(
          message.buttons.map((row) =>
            row.map((button) => this.toMaxButton(button)),
          ),
        )
      : undefined;
  }

  private toMaxButton(button: MessengerButton): Record<string, unknown> {
    switch (button.kind) {
      case 'open_app':
        return this.botService.openAppButton(button.text);
      case 'link':
        return { type: 'link', text: button.text, url: button.url };
      case 'callback':
        return { type: 'callback', text: button.text, payload: button.payload };
    }
  }
}
