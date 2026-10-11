import { Injectable, Logger } from '@nestjs/common';

import { MessengerUser, MessengerUserStore } from '../../messenger.types';
import { parseVkRef } from '../deeplink/vk-deeplink.util';
import { VkLinkService } from '../deeplink/vk-link.service';
import { VkLoginService } from '../deeplink/vk-login.service';
import { VkDialogService } from '../dialog/vk-dialog.service';
import { VkAppAdapter } from '../vk-app.adapter';
import { VK_CALLBACK, VK_LOG_EMOJI } from '../vk.constants';
import {
  VkCallbackContext,
  VkKeyboard,
  VkKeyboardButton,
  VkMessageContext,
} from '../vk.types';

import { VkBotService } from './vk-bot.service';

/** Событие Bots Long Poll API. Форма задана VK, поэтому поля проверяются вручную при разборе. */
export interface VkUpdate {
  type: string;
  group_id?: number;
  event_id?: string;
  object?: Record<string, unknown>;
}

interface VkIncomingMessage {
  from_id: number;
  peer_id: number;
  text?: string;
  /** ref из ссылки vk.me — приходит с первым сообщением после перехода. */
  ref?: string;
  /** payload кнопки, которой отправлено сообщение (кнопка «Начать» — {"command":"start"}). */
  payload?: string;
}

interface VkMessageEvent {
  user_id: number;
  peer_id: number;
  event_id: string;
  conversation_message_id: number;
  payload?: unknown;
}

/** peer_id бесед начинается с 2e9 — бот работает только с личными сообщениями сообществу. */
const CHAT_PEER_OFFSET = 2_000_000_000;

/**
 * Обработчики событий сообщества: сообщения (с диплинками входа и привязки через ref), разрешение
 * и запрет сообщений, нажатия callback-кнопок. Зеркало TelegramBotUpdate.
 *
 * Свои кнопки и сообщения проект обрабатывает в VkAppAdapter.onCallback / onMessage.
 */
@Injectable()
export class VkBotUpdate {
  private readonly logger = new Logger(`${VK_LOG_EMOJI} ${VkBotUpdate.name}`);

  constructor(
    private readonly users: MessengerUserStore,
    private readonly botService: VkBotService,
    private readonly dialogService: VkDialogService,
    private readonly loginService: VkLoginService,
    private readonly linkService: VkLinkService,
    private readonly adapter: VkAppAdapter,
  ) {}

  // ── Диспетчер ───────────────────────────────────────────────────────────

  public async handle(update: VkUpdate): Promise<void> {
    switch (update.type) {
      case 'message_new':
        return this.onMessage(
          update.object?.message as VkIncomingMessage | undefined,
        );
      case 'message_event':
        return this.onCallback(
          update.object as unknown as VkMessageEvent | undefined,
        );
      case 'message_allow':
        return this.onMessagesAllowed(Number(update.object?.user_id), true);
      case 'message_deny':
        return this.onMessagesAllowed(Number(update.object?.user_id), false);
      default:
        this.logger.debug(`Событие ${update.type} не обрабатывается`);
    }
  }

  // ── События сообщества ──────────────────────────────────────────────────

  /** Разрешение/запрет сообщений от сообщества — от этого зависит, дойдут ли уведомления. */
  private async onMessagesAllowed(
    vkId: number,
    allowed: boolean,
  ): Promise<void> {
    if (!Number.isInteger(vkId) || vkId <= 0) {
      this.logger.warn(
        `message_${allowed ? 'allow' : 'deny'} без валидного user_id`,
      );
      return;
    }
    this.logger.log(`message_${allowed ? 'allow' : 'deny'} от vkId=${vkId}`);
    if (allowed) await this.dialogService.markStarted(vkId);
    else await this.dialogService.markClosed(vkId);
  }

  // ── Сообщения ───────────────────────────────────────────────────────────

  /**
   * Любое сообщение пользователя. С ref из ссылки vk.me — вход/привязка, иначе сначала даём
   * шанс проекту (адаптер), а потом приветствие.
   */
  private async onMessage(
    message: VkIncomingMessage | undefined,
  ): Promise<void> {
    if (!message || message.peer_id >= CHAT_PEER_OFFSET || message.from_id <= 0)
      return;
    const vkId = message.from_id;
    const intent = parseVkRef(message.ref);
    const isStart = this.isStartCommand(message.payload);
    this.logger.log(
      `message_new от vkId=${vkId}, ref=${message.ref || '—'}${isStart ? ', «Начать»' : ''}`,
    );

    // Профиль тянем только на входе в чат — на каждое сообщение лишний запрос к VK
    const profile =
      intent || isStart ? await this.botService.fetchProfile(vkId) : undefined;
    const user = await this.dialogService.markStarted(vkId, profile);
    const ctx = this.messageContext(message);

    if (intent?.kind === 'login')
      return this.askLoginConfirmation(ctx, intent.token);
    if (intent?.kind === 'link')
      return this.askLinkConfirmation(ctx, intent.token);
    if (!isStart && (await this.adapter.onMessage(ctx, user))) return;
    await this.sendWelcome(ctx, user);
  }

  // ── Кнопки ──────────────────────────────────────────────────────────────

  private async onCallback(event: VkMessageEvent | undefined): Promise<void> {
    if (!event?.user_id) return;
    const vkId = event.user_id;
    const payload = this.readCallbackPayload(event.payload);
    this.logger.log(`message_event от vkId=${vkId}, payload=${payload}`);
    const ctx = this.callbackContext(event, payload);

    try {
      if (payload.startsWith(VK_CALLBACK.loginConfirm)) {
        return await this.confirmLogin(
          ctx,
          payload.slice(VK_CALLBACK.loginConfirm.length),
        );
      }
      if (payload.startsWith(VK_CALLBACK.loginReject)) {
        this.loginService.reject(
          payload.slice(VK_CALLBACK.loginReject.length),
          vkId,
        );
        await ctx.answer('Вход отклонён');
        return await ctx.replaceMessage(
          '❌ Вход отклонён. Если вы не запрашивали вход — никому не пересылайте ссылки входа.',
        );
      }
      if (payload.startsWith(VK_CALLBACK.linkConfirm)) {
        return await this.confirmLink(
          ctx,
          payload.slice(VK_CALLBACK.linkConfirm.length),
        );
      }
      if (payload.startsWith(VK_CALLBACK.linkReject)) {
        this.linkService.reject(
          payload.slice(VK_CALLBACK.linkReject.length),
          vkId,
        );
        await ctx.answer('Привязка отклонена');
        return await ctx.replaceMessage('❌ Привязка отклонена.');
      }
      if (payload === VK_CALLBACK.notificationsCheck) {
        return await this.checkNotifications(ctx);
      }

      // Клик по кнопке доказывает, что пользователь в чате с сообществом
      const user = await this.dialogService.markStarted(vkId);
      const handled = await this.adapter.onCallback(ctx, user);
      if (!handled) {
        this.logger.warn(
          `Кнопка не распознана ни модулем, ни адаптером: payload=${payload}`,
        );
        await ctx.answer('Кнопка устарела');
      }
    } catch (error) {
      this.logger.error(
        `Ошибка обработки кнопки payload=${payload}, vkId=${vkId}`,
        (error as Error).stack,
      );
      await ctx
        .answer('Что-то пошло не так, попробуйте ещё раз')
        .catch(() => undefined);
    }
  }

  // ── Вход через VK ───────────────────────────────────────────────────────

  private async askLoginConfirmation(
    ctx: VkMessageContext,
    token: string,
  ): Promise<void> {
    if (!this.loginService.isPending(token)) {
      await ctx.reply(
        '⏳ Ссылка входа устарела. Обновите QR-код на странице входа и откройте его снова.',
      );
      return;
    }
    await ctx.reply(
      `🔐 Запрос на вход в веб-версию

Кто-то открыл страницу входа и хочет войти под вашим VK-аккаунтом. Подтверждайте, только если это вы сами входите в браузере прямо сейчас.

Если вы не начинали вход — нажмите «Отклонить» и никому не пересылайте эту ссылку.`,
      this.botService.keyboard([
        [
          this.botService.callbackButton(
            '✅ Подтвердить вход',
            `${VK_CALLBACK.loginConfirm}${token}`,
            'positive',
          ),
        ],
        [
          this.botService.callbackButton(
            '❌ Отклонить',
            `${VK_CALLBACK.loginReject}${token}`,
            'negative',
          ),
        ],
      ]),
    );
  }

  private async confirmLogin(
    ctx: VkCallbackContext,
    token: string,
  ): Promise<void> {
    if (!this.loginService.isPending(token)) {
      await ctx.answer('Ссылка устарела');
      await ctx.replaceMessage(
        '⏳ Ссылка входа устарела. Обновите QR-код на странице входа.',
      );
      return;
    }
    // Вход создаёт VK-аккаунт, если его ещё нет, — так же, как первый заход в мини-приложение
    const user = await this.dialogService.markStarted(ctx.vkId);
    await this.loginService.confirm(token, user);
    await ctx.answer('Вход подтверждён');
    await ctx.replaceMessage(
      '✅ Вход подтверждён. Вернитесь в браузер — вход выполнится автоматически.',
    );
  }

  // ── Привязка к веб-аккаунту ─────────────────────────────────────────────

  private async askLinkConfirmation(
    ctx: VkMessageContext,
    token: string,
  ): Promise<void> {
    const targetUserId = this.linkService.peek(token);
    if (targetUserId === null) {
      await ctx.reply(
        '⏳ Ссылка привязки устарела. Запросите новую в профиле веб-версии.',
      );
      return;
    }
    const label =
      (await this.adapter.describeAccount(targetUserId)) ?? `#${targetUserId}`;
    await ctx.reply(
      `🔗 Привязать этот VK-аккаунт к аккаунту ${label}?

После привязки вход через VK и уведомления будут работать для этого аккаунта. Если вы не запрашивали привязку или не узнаёте аккаунт — нажмите «Отклонить».`,
      this.botService.keyboard([
        [
          this.botService.callbackButton(
            '✅ Привязать',
            `${VK_CALLBACK.linkConfirm}${token}`,
            'positive',
          ),
        ],
        [
          this.botService.callbackButton(
            '❌ Отклонить',
            `${VK_CALLBACK.linkReject}${token}`,
            'negative',
          ),
        ],
      ]),
    );
  }

  private async confirmLink(
    ctx: VkCallbackContext,
    token: string,
  ): Promise<void> {
    const vkId = ctx.vkId;
    const targetUserId = this.linkService.consume(token);
    if (targetUserId === null) {
      await ctx.answer('Ссылка устарела');
      await ctx.replaceMessage(
        '⏳ Ссылка привязки устарела. Запросите новую в профиле веб-версии.',
      );
      return;
    }

    const existingUser = await this.users.findByExternalId('VK', String(vkId));
    const vkUser = (await this.botService.fetchProfile(vkId)) ?? { id: vkId };
    let linked: MessengerUser;
    try {
      linked = await this.adapter.linkAccount({
        targetUserId,
        vkUser,
        existingUser,
      });
    } catch (error) {
      this.logger.warn(
        `Привязка vkId=${vkId} к userId=${targetUserId} не удалась: ${(error as Error).message}`,
      );
      await ctx.answer('Не удалось привязать');
      await ctx.replaceMessage(`⚠️ ${(error as Error).message}`);
      return;
    }

    // При слиянии аккаунтов vkId переезжает без флага открытого чата — ставим его на итоговую строку
    await this.dialogService.markStarted(vkId);
    this.logger.log(`VK vkId=${vkId} привязан к userId=${linked.id}`);
    const label =
      (await this.adapter.describeAccount(linked.id)) ?? `#${linked.id}`;
    await ctx.answer('VK привязан');
    await ctx.replaceMessage(
      `✅ VK привязан к аккаунту ${label}. Уведомления будут приходить в этот чат — не запрещайте сообщения от сообщества.`,
      this.botService.keyboard([[this.botService.openAppButton()]]),
    );
  }

  // ── Приветствие и проверка уведомлений ──────────────────────────────────

  private async sendWelcome(
    ctx: VkMessageContext,
    user: MessengerUser | null,
  ): Promise<void> {
    const links = this.adapter
      .welcomeLinks()
      .map((link) => this.botService.linkButton(link.text, link.url));
    const linkRows: VkKeyboardButton[][] = [];
    for (let i = 0; i < links.length; i += 2)
      linkRows.push(links.slice(i, i + 2));

    await ctx.reply(
      this.adapter.welcomeText(),
      this.botService.keyboard([
        [this.botService.openAppButton('🚀 Открыть приложение')],
        ...linkRows,
        ...this.adapter
          .welcomeCallbacks(user)
          .map((button) => [
            this.botService.callbackButton(button.text, button.payload),
          ]),
        [
          this.botService.callbackButton(
            '🔔 Проверить уведомления',
            VK_CALLBACK.notificationsCheck,
            'primary',
          ),
        ],
      ]),
    );
  }

  /**
   * Сам клик уже доказывает, что пользователь в чате. Но если этот vkId не знаком, уведомления
   * слать некому — не заводим под него пользователя, а просим привязать VK.
   */
  private async checkNotifications(ctx: VkCallbackContext): Promise<void> {
    const existing = await this.users.findByExternalId('VK', String(ctx.vkId));
    if (!existing) {
      await ctx.answer('VK не привязан к аккаунту');
      await ctx.reply(
        '⚠️ Этот VK-аккаунт ещё не привязан к аккаунту в веб-версии — уведомления доставить некуда.',
      );
      return;
    }
    await this.dialogService.markStarted(ctx.vkId);
    await ctx.answer('Уведомления подключены');
    await ctx.reply(
      '✅ Уведомления подключены — сюда будут приходить важные события. Не запрещайте сообщения от сообщества, иначе доставка остановится.',
    );
  }

  // ── Вспомогательное ─────────────────────────────────────────────────────

  private messageContext(message: VkIncomingMessage): VkMessageContext {
    return {
      vkId: message.from_id,
      peerId: message.peer_id,
      text: message.text ?? '',
      reply: async (text: string, keyboard?: VkKeyboard) => {
        await this.botService.sendMessage(message.from_id, text, keyboard);
      },
    };
  }

  /**
   * Ответ на кнопку с заменой исходного сообщения — кнопки подтверждения исчезают, второй раз не нажать.
   * Сообщение уже нельзя редактировать (старше суток и т.п.) — результат всё равно показываем новым.
   */
  private callbackContext(
    event: VkMessageEvent,
    payload: string,
  ): VkCallbackContext {
    const reply = async (text: string, keyboard?: VkKeyboard) => {
      await this.botService.sendMessage(event.user_id, text, keyboard);
    };
    return {
      vkId: event.user_id,
      peerId: event.peer_id,
      conversationMessageId: event.conversation_message_id,
      payload,
      answer: async (snackbarText?: string) => {
        await this.botService.answerEvent({
          eventId: event.event_id,
          vkId: event.user_id,
          peerId: event.peer_id,
          text: snackbarText,
        });
      },
      replaceMessage: async (text: string, keyboard?: VkKeyboard) => {
        try {
          await this.botService.editMessage(
            event.peer_id,
            event.conversation_message_id,
            text,
            keyboard,
          );
        } catch (error) {
          this.logger.debug(
            `Не удалось заменить сообщение: ${(error as Error).message}`,
          );
          await reply(text, keyboard);
        }
      },
      reply,
    };
  }

  /** payload callback-кнопки VK отдаёт объектом; строка модуля лежит в поле `p` (см. VK_CALLBACK). */
  private readCallbackPayload(raw: unknown): string {
    const value = typeof raw === 'string' ? this.parseJson(raw) : raw;
    const p =
      value && typeof value === 'object'
        ? (value as Record<string, unknown>).p
        : undefined;
    return typeof p === 'string' ? p : '';
  }

  private isStartCommand(payload: string | undefined): boolean {
    const value = payload ? this.parseJson(payload) : null;
    return (
      !!value &&
      typeof value === 'object' &&
      (value as Record<string, unknown>).command === 'start'
    );
  }

  private parseJson(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
