import { Injectable, OnModuleInit } from '@nestjs/common';
import type { Context } from 'telegraf';
import type { InlineKeyboardButton } from 'telegraf/types';

import {
  MessengerButton,
  MessengerCallbackMessage,
  MessengerChannel,
  MessengerMessage,
  MessengerRegistry,
  MessengerSendResult,
} from '../../index';

import { textSpans } from '../../messenger-format';
import type { MessengerUser } from '../../messenger.types';
import { TelegramBotService } from '../bot/telegram-bot.service';
import { TelegramDialogService } from '../dialog/telegram-dialog.service';

/**
 * Telegram как реализация общего контракта мессенджеров (src/messengers). Через него идут
 * уведомления: NotificationsService берёт канал 'TELEGRAM' из MessengerRegistry и не знает про
 * TelegramBotService. Регистрируется в реестре сам при старте модуля.
 */
@Injectable()
export class TelegramMessengerChannel
  implements MessengerChannel, OnModuleInit
{
  public readonly channel = 'TELEGRAM' as const;

  constructor(
    private readonly registry: MessengerRegistry,
    private readonly botService: TelegramBotService,
    private readonly dialogService: TelegramDialogService,
  ) {}

  public onModuleInit(): void {
    this.registry.register(this);
  }

  // ── Контракт MessengerChannel ───────────────────────────────────────────

  /** Telegram привязан и бот не заблокирован — иначе Telegram ответит 403. */
  public canDeliver(user: MessengerUser): boolean {
    return this.dialogService.canDeliver(user);
  }

  public async send(
    user: MessengerUser,
    message: MessengerMessage,
  ): Promise<MessengerSendResult> {
    if (!user.telegramId)
      throw new Error('У пользователя не привязан Telegram');
    const { text, extra } = this.format(message);
    if (message.image) {
      const imageId = await this.botService.sendPhoto(
        user.telegramId,
        { fileId: message.image.cachedId, path: message.image.path },
        text,
        extra,
      );
      return { imageId };
    }
    await this.botService.sendMessage(user.telegramId, text, extra);
    return {};
  }

  // ── Ответ правкой сообщения ─────────────────────────────────────────────

  /** Сообщение с нажатой кнопкой (контекст callback_query из TelegramAppAdapter.onCallback). */
  public callbackMessage(ctx: Context): MessengerCallbackMessage {
    return {
      channel: this.channel,
      // date — в секундах; у сообщений старше 48 ч Telegram отдаёт date = 0 (inaccessible message)
      sentAt: async () => {
        const date = ctx.callbackQuery?.message?.date;
        return date ? new Date(date * 1000) : null;
      },
      // Без reply_markup Telegram убирает inline-клавиатуру. Тот же текст — ошибка «message is not modified»
      edit: async (message) => {
        const { text, extra } = this.format(message);
        await ctx.editMessageText(text, {
          reply_markup: extra.reply_markup as never,
          entities: extra.entities,
          link_preview_options: extra.link_preview_options,
        });
      },
    };
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /** Текст без маркеров разметки и extra с клавиатурой и entities. */
  private format(message: MessengerMessage) {
    const { text, spans } = textSpans(message.text);
    return {
      text,
      extra: {
        reply_markup: this.toExtra(message)?.reply_markup,
        entities: spans.length ? spans : undefined,
        // Ссылка под подписью иначе тянет за собой карточку-превью страницы
        link_preview_options: spans.some((span) => span.type === 'text_link')
          ? { is_disabled: true }
          : undefined,
      },
    };
  }

  private toExtra(message: MessengerMessage) {
    return message.buttons?.length
      ? this.botService.keyboard(
          message.buttons.map((row) =>
            row.map((button) => this.toTelegramButton(button)),
          ),
        )
      : undefined;
  }

  private toTelegramButton(button: MessengerButton): InlineKeyboardButton {
    switch (button.kind) {
      case 'open_app':
        return this.botService.openAppButton(button.text);
      case 'link':
        return { text: button.text, url: button.url };
      case 'callback':
        // Лимит Telegram на callback_data — 64 байта: длинный payload отклонит весь sendMessage
        return { text: button.text, callback_data: button.payload };
    }
  }
}
