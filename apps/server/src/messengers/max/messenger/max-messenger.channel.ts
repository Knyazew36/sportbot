import { Injectable, OnModuleInit } from '@nestjs/common';
import type { Context } from 'max-io';

import {
  MessengerButton,
  MessengerCallbackMessage,
  MessengerChannel,
  MessengerMessage,
  MessengerRegistry,
  MessengerSendResult,
} from '../../index';

import { toHtml } from '../../messenger-format';
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
  ): Promise<MessengerSendResult> {
    if (!user.maxId) throw new Error('У пользователя не привязан MAX');
    const { text, format } = this.format(message);
    if (!message.image) {
      await this.botService.sendMessage(user.maxId, text, {
        ...this.toExtra(message),
        format,
      });
      return {};
    }
    const image = await this.botService.imageAttachment({
      token: message.image.cachedId,
      path: message.image.path,
    });
    const extra = {
      attachments: [image, ...(this.toExtra(message)?.attachments ?? [])],
      format,
    };
    // Только что загруженная картинка может быть ещё не обработана — ждём и повторяем
    for (let attempt = 1; ; attempt++) {
      try {
        const sent = await this.botService.sendMessage(user.maxId, text, extra);
        const attachments = (sent?.body?.attachments ?? []) as Array<{
          type: string;
          payload?: { token?: string };
        }>;
        return {
          imageId: attachments.find((a) => a.type === 'image')?.payload?.token,
        };
      } catch (error) {
        if (
          attempt >= 4 ||
          !(error as Error).message.includes('attachment.not.ready')
        )
          throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
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
        const { text, format } = this.format(message);
        const result = await ctx.editMessage({
          text,
          attachments: this.toExtra(message)?.attachments ?? [],
          format,
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

  /**
   * Ответить на нажатие кнопки заменой сообщения — одним вызовом и ответ на callback, и правка.
   * Бросает, если платформа отказала. На одно нажатие MAX принимает один ответ: после него
   * править сообщение можно только через callbackMessage(ctx).edit.
   */
  public async answerWithMessage(
    ctx: Context,
    message: MessengerMessage,
  ): Promise<void> {
    const { text, format } = this.format(message);
    const result = await ctx.answerOnCallback({
      message: {
        text,
        attachments: this.toExtra(message)?.attachments ?? [],
        format,
      },
    });
    if (!result.success) {
      const reason = 'message' in result ? result.message : undefined;
      throw new Error(
        `MAX: не удалось заменить сообщение: ${reason ?? 'без причины'}`,
      );
    }
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /** Текст в разметке MAX: курсив есть — HTML, нет — обычный текст без режима разметки. */
  private format(message: MessengerMessage): {
    text: string;
    format: 'html' | undefined;
  } {
    const { text, html } = toHtml(message.text);
    return { text, format: html ? 'html' : undefined };
  }

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
        return this.botService.openAppButton(button.text, button.startParam);
      case 'link':
        return { type: 'link', text: button.text, url: button.url };
      case 'callback':
        return { type: 'callback', text: button.text, payload: button.payload };
    }
  }
}
