import { Inject, Injectable, Logger } from '@nestjs/common';

import { VkApiClient, VkApiError } from '../api/vk-api.client';
import { VkDialogService } from '../dialog/vk-dialog.service';
import {
  VK_INTEGRATION_OPTIONS,
  VK_LOG_EMOJI,
  VK_UNREACHABLE_ERROR_CODES,
} from '../vk.constants';
import {
  VkIntegrationOptions,
  VkKeyboard,
  VkKeyboardButton,
  VkUserInfo,
} from '../vk.types';

/** Лимит VK на подпись кнопки — длиннее VK отклонит всё сообщение. */
const BUTTON_LABEL_MAX = 40;

/** Пустая inline-клавиатура: messages.edit без keyboard оставил бы старые кнопки. */
const EMPTY_KEYBOARD: VkKeyboard = { inline: true, buttons: [] };

/**
 * Отправка сообщений пользователям от имени сообщества.
 *
 * Использование снаружи модуля:
 *   - sendMessage(vkId, text, keyboard) — отправить и узнать об ошибке (бросает);
 *   - keyboard(rows) / callbackButton / linkButton / openAppButton — собрать клавиатуру;
 *   - перед отправкой уведомлений проверять VkDialogService.canDeliver(user).
 *
 * Если пользователь запретил сообщения, VK ответит ошибкой 901 — сервис сам пометит чат закрытым,
 * чтобы следующие уведомления не долбили VK впустую до нового разрешения.
 */
@Injectable()
export class VkBotService {
  private readonly logger = new Logger(`${VK_LOG_EMOJI} ${VkBotService.name}`);

  constructor(
    @Inject(VK_INTEGRATION_OPTIONS)
    private readonly options: VkIntegrationOptions,
    private readonly api: VkApiClient,
    private readonly dialogService: VkDialogService,
  ) {}

  // ── Отправка ────────────────────────────────────────────────────────────

  public async sendMessage(
    vkId: string | number,
    text: string,
    keyboard?: VkKeyboard,
  ): Promise<number> {
    try {
      const messageId = await this.api.call<number>('messages.send', {
        user_id: vkId,
        // random_id защищает от дублей при повторе запроса — VK не отправит второе сообщение с тем же id
        random_id: Math.floor(Math.random() * 2 ** 31),
        message: text,
        keyboard: keyboard ? JSON.stringify(keyboard) : undefined,
      });
      this.logger.debug(
        `Сообщение отправлено vkId=${vkId}, messageId=${messageId}`,
      );
      return messageId;
    } catch (error) {
      this.logger.error(
        `Ошибка отправки сообщения vkId=${vkId}: ${(error as Error).message}`,
      );
      if (
        error instanceof VkApiError &&
        VK_UNREACHABLE_ERROR_CODES.includes(error.code)
      ) {
        await this.dialogService.markClosed(vkId);
      }
      throw error;
    }
  }

  /** Заменить текст и кнопки сообщения бота. keyboard не передан — кнопки убираются. */
  public async editMessage(
    peerId: number,
    conversationMessageId: number,
    text: string,
    keyboard?: VkKeyboard,
  ): Promise<void> {
    await this.api.call<number>('messages.edit', {
      peer_id: peerId,
      conversation_message_id: conversationMessageId,
      message: text,
      keyboard: JSON.stringify(keyboard ?? EMPTY_KEYBOARD),
    });
  }

  /**
   * Когда отправлено сообщение диалога (message_event не несёт дату — только conversation_message_id).
   * null — VK не отдал сообщение (удалено) или запрос не удался: дата нужна для решения, а не для доставки.
   */
  public async getMessageDate(
    peerId: number,
    conversationMessageId: number,
  ): Promise<Date | null> {
    try {
      const result = await this.api.call<{ items: { date: number }[] }>(
        'messages.getByConversationMessageId',
        {
          group_id: this.options.groupId,
          peer_id: peerId,
          conversation_message_ids: conversationMessageId,
        },
      );
      const date = result.items[0]?.date;
      return date ? new Date(date * 1000) : null;
    } catch (error) {
      this.logger.warn(
        `Не удалось получить дату сообщения peerId=${peerId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /** Ответ на нажатие callback-кнопки. Без ответа VK показывает у кнопки бесконечную загрузку. */
  public async answerEvent(params: {
    eventId: string;
    vkId: number;
    peerId: number;
    text?: string;
  }): Promise<void> {
    await this.api.call<number>('messages.sendMessageEventAnswer', {
      event_id: params.eventId,
      user_id: params.vkId,
      peer_id: params.peerId,
      event_data: params.text
        ? JSON.stringify({
            type: 'show_snackbar',
            text: params.text.slice(0, 90),
          })
        : undefined,
    });
  }

  // ── Пользователи и разрешения ───────────────────────────────────────────

  /** Разрешил ли пользователь сообщения от сообщества — по данным самого VK. */
  public async isMessagesAllowed(vkId: string | number): Promise<boolean> {
    const result = await this.api.call<{ is_allowed: number }>(
      'messages.isMessagesFromGroupAllowed',
      {
        group_id: this.options.groupId,
        user_id: vkId,
      },
    );
    return result.is_allowed === 1;
  }

  /** Профиль пользователя для vkData. Не удалось — undefined: профиль не критичен для входа и уведомлений. */
  public async fetchProfile(vkId: number): Promise<VkUserInfo | undefined> {
    try {
      const [user] = await this.api.call<VkUserInfo[]>('users.get', {
        user_ids: vkId,
        fields: 'screen_name,photo_200',
      });
      return user ? { ...user, id: vkId } : undefined;
    } catch (error) {
      this.logger.warn(
        `Не удалось получить профиль vkId=${vkId}: ${(error as Error).message}`,
      );
      return undefined;
    }
  }

  // ── Клавиатуры ──────────────────────────────────────────────────────────

  public keyboard(rows: VkKeyboardButton[][]): VkKeyboard {
    return { inline: true, buttons: rows };
  }

  /** Кнопка с ответом боту: нажатие придёт событием message_event со строкой payload. */
  public callbackButton(
    text: string,
    payload: string,
    color: 'primary' | 'secondary' | 'positive' | 'negative' = 'secondary',
  ): VkKeyboardButton {
    return {
      action: {
        type: 'callback',
        label: this.label(text),
        payload: JSON.stringify({ p: payload }),
      },
      color,
    };
  }

  public linkButton(text: string, url: string): VkKeyboardButton {
    return {
      action: { type: 'open_link', label: this.label(text), link: url },
    };
  }

  /**
   * Кнопка, открывающая мини-приложение прямо в VK (open_app). Без appId — ссылка на веб-версию,
   * без неё тоже — на страницу сообщества.
   */
  public openAppButton(text = '🚀 Открыть приложение'): VkKeyboardButton {
    if (this.options.appId) {
      return {
        action: {
          type: 'open_app',
          label: this.label(text),
          app_id: this.options.appId,
        },
      };
    }
    return this.linkButton(
      text,
      this.options.webAppUrl ?? `https://vk.com/club${this.options.groupId}`,
    );
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private label(text: string): string {
    return text.length > BUTTON_LABEL_MAX
      ? `${text.slice(0, BUTTON_LABEL_MAX - 1)}…`
      : text;
  }
}
