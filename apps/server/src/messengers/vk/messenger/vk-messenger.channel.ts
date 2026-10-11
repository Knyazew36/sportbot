import { Injectable, OnModuleInit } from '@nestjs/common';

import {
  MessengerButton,
  MessengerCallbackMessage,
  MessengerChannel,
  MessengerMessage,
  MessengerRegistry,
} from '../../index';

import type { MessengerUser } from '../../messenger.types';
import { VkBotService } from '../bot/vk-bot.service';
import { VkDialogService } from '../dialog/vk-dialog.service';
import { VkCallbackContext, VkKeyboard, VkKeyboardButton } from '../vk.types';

/**
 * VK как реализация общего контракта мессенджеров (src/messengers). Через него идут уведомления:
 * NotificationsService берёт канал 'VK' из MessengerRegistry и не знает про VkBotService.
 * Регистрируется в реестре сам при старте модуля.
 */
@Injectable()
export class VkMessengerChannel implements MessengerChannel, OnModuleInit {
  public readonly channel = 'VK' as const;

  constructor(
    private readonly registry: MessengerRegistry,
    private readonly botService: VkBotService,
    private readonly dialogService: VkDialogService,
  ) {}

  public onModuleInit(): void {
    this.registry.register(this);
  }

  // ── Контракт MessengerChannel ───────────────────────────────────────────

  /** VK привязан и сообщения от сообщества разрешены — иначе VK ответит ошибкой 901. */
  public canDeliver(user: MessengerUser): boolean {
    return this.dialogService.canDeliver(user);
  }

  public async send(
    user: MessengerUser,
    message: MessengerMessage,
  ): Promise<void> {
    if (!user.vkId) throw new Error('У пользователя не привязан VK');
    await this.botService.sendMessage(
      user.vkId,
      message.text,
      this.toKeyboard(message),
    );
  }

  // ── Ответ правкой сообщения ─────────────────────────────────────────────

  /** Сообщение с нажатой кнопкой (контекст message_event из VkAppAdapter.onCallback). */
  public callbackMessage(ctx: VkCallbackContext): MessengerCallbackMessage {
    return {
      channel: this.channel,
      // Дата — отдельным запросом к VK, поэтому только по требованию
      sentAt: () =>
        this.botService.getMessageDate(ctx.peerId, ctx.conversationMessageId),
      // VK разрешает править сообщения сообщества около суток — старше бросит ошибку
      edit: (message) =>
        this.botService.editMessage(
          ctx.peerId,
          ctx.conversationMessageId,
          message.text,
          this.toKeyboard(message),
        ),
    };
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private toKeyboard(message: MessengerMessage): VkKeyboard | undefined {
    return message.buttons?.length
      ? this.botService.keyboard(
          message.buttons.map((row) =>
            row.map((button) => this.toVkButton(button)),
          ),
        )
      : undefined;
  }

  private toVkButton(button: MessengerButton): VkKeyboardButton {
    switch (button.kind) {
      case 'open_app':
        return this.botService.openAppButton(button.text);
      case 'link':
        return this.botService.linkButton(button.text, button.url);
      case 'callback':
        // Лимит VK на payload кнопки — 255 байт: длинный payload отклонит весь messages.send
        return this.botService.callbackButton(button.text, button.payload);
    }
  }
}
