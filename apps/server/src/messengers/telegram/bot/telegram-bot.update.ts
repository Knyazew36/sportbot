import { Logger } from '@nestjs/common';
import { Ctx, On, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';

import { MessengerUser, MessengerUserStore } from '../../messenger.types';
import { parseTelegramStartPayload } from '../deeplink/telegram-deeplink.util';
import { TelegramLinkService } from '../deeplink/telegram-link.service';
import { TelegramLoginService } from '../deeplink/telegram-login.service';
import { TelegramDialogService } from '../dialog/telegram-dialog.service';
import { TelegramAppAdapter } from '../telegram-app.adapter';
import { TELEGRAM_CALLBACK, TELEGRAM_LOG_EMOJI } from '../telegram.constants';
import { TelegramUserInfo } from '../telegram.types';

import {
  TelegramBotService,
  TelegramKeyboardRow,
  TelegramSendExtra,
} from './telegram-bot.service';

/**
 * Обработчики событий бота: /start (с диплинками входа и привязки), блокировка/разблокировка
 * бота, кнопки, сообщения.
 *
 * Важно про nestjs-telegraf: обработчики не вызывают next(), поэтому апдейт получает только
 * первый подходящий. Порядок методов в классе = порядок регистрации: @Start обязан стоять
 * раньше @On('message'), иначе /start уйдёт в обработчик сообщений. Свои кнопки и сообщения
 * проект обрабатывает в TelegramAppAdapter.onCallback / onMessage, а не вторым @On.
 *
 * Работаем только с личными чатами: в группах бот уведомлений не шлёт и вход не ведёт.
 */
@Update()
export class TelegramBotUpdate {
  private readonly logger = new Logger(
    `${TELEGRAM_LOG_EMOJI} ${TelegramBotUpdate.name}`,
  );

  constructor(
    private readonly users: MessengerUserStore,
    private readonly botService: TelegramBotService,
    private readonly dialogService: TelegramDialogService,
    private readonly loginService: TelegramLoginService,
    private readonly linkService: TelegramLinkService,
    private readonly adapter: TelegramAppAdapter,
  ) {}

  // ── События чата ────────────────────────────────────────────────────────

  /** «Start» в чате или переход по ссылке https://t.me/<bot>?start=<payload>. */
  @Start()
  public async onStart(
    @Ctx() ctx: Context & { payload?: string },
  ): Promise<void> {
    if (ctx.chat?.type !== 'private' || !ctx.from) return;
    const telegramId = ctx.from.id;
    const payload = ctx.payload;
    this.logger.log(
      `/start от telegramId=${telegramId}, payload=${payload || '—'}`,
    );

    const user = await this.dialogService.markStarted(
      telegramId,
      this.toUserInfo(ctx),
    );

    const intent = parseTelegramStartPayload(payload);
    if (intent?.kind === 'login')
      return this.askLoginConfirmation(ctx, intent.token);
    if (intent?.kind === 'link')
      return this.askLinkConfirmation(ctx, intent.token);
    await this.sendWelcome(ctx, user);
  }

  /** Пользователь заблокировал или разблокировал бота — от этого зависит, дойдут ли уведомления. */
  @On('my_chat_member')
  public async onMyChatMember(@Ctx() ctx: Context): Promise<void> {
    const update = ctx.myChatMember;
    if (!update || update.chat.type !== 'private') return;
    const telegramId = update.from.id;
    const status = update.new_chat_member.status;
    this.logger.log(
      `my_chat_member от telegramId=${telegramId}: ${update.old_chat_member.status} → ${status}`,
    );

    if (status === 'kicked') {
      await this.dialogService.markClosed(telegramId);
      return;
    }
    if (status === 'member') {
      await this.dialogService.markStarted(telegramId, this.toUserInfo(ctx));
    }
  }

  // ── Кнопки ──────────────────────────────────────────────────────────────

  @On('callback_query')
  public async onCallback(@Ctx() ctx: Context): Promise<void> {
    const telegramId = ctx.from?.id;
    const query = ctx.callbackQuery;
    const payload = query && 'data' in query ? query.data : '';
    this.logger.log(
      `callback_query от telegramId=${telegramId}, payload=${payload}`,
    );
    if (telegramId == null) {
      await ctx.answerCbQuery('Не удалось определить пользователя');
      return;
    }

    try {
      if (payload.startsWith(TELEGRAM_CALLBACK.loginConfirm)) {
        return await this.confirmLogin(
          ctx,
          telegramId,
          payload.slice(TELEGRAM_CALLBACK.loginConfirm.length),
        );
      }
      if (payload.startsWith(TELEGRAM_CALLBACK.loginReject)) {
        this.loginService.reject(
          payload.slice(TELEGRAM_CALLBACK.loginReject.length),
          telegramId,
        );
        return await this.replaceMessage(
          ctx,
          'Вход отклонён',
          '❌ Вход отклонён. Если вы не запрашивали вход — никому не пересылайте ссылки входа.',
        );
      }
      if (payload.startsWith(TELEGRAM_CALLBACK.linkConfirm)) {
        return await this.confirmLink(
          ctx,
          telegramId,
          payload.slice(TELEGRAM_CALLBACK.linkConfirm.length),
        );
      }
      if (payload.startsWith(TELEGRAM_CALLBACK.linkReject)) {
        this.linkService.reject(
          payload.slice(TELEGRAM_CALLBACK.linkReject.length),
          telegramId,
        );
        return await this.replaceMessage(
          ctx,
          'Привязка отклонена',
          '❌ Привязка отклонена.',
        );
      }
      if (payload === TELEGRAM_CALLBACK.notificationsCheck) {
        return await this.checkNotifications(ctx, telegramId);
      }

      // Клик по кнопке доказывает, что бот не заблокирован
      const user = await this.dialogService.markStarted(
        telegramId,
        this.toUserInfo(ctx),
      );
      const handled = await this.adapter.onCallback(ctx, user);
      if (!handled) {
        this.logger.warn(
          `Кнопка не распознана ни модулем, ни адаптером: payload=${payload}`,
        );
        await ctx.answerCbQuery('Кнопка устарела');
      }
    } catch (error) {
      this.logger.error(
        `Ошибка обработки кнопки payload=${payload}, telegramId=${telegramId}`,
        (error as Error).stack,
      );
      await ctx
        .answerCbQuery('Что-то пошло не так, попробуйте ещё раз')
        .catch(() => undefined);
    }
  }

  // ── Сообщения ───────────────────────────────────────────────────────────

  /** Любое сообщение пользователя: сначала даём шанс проекту (адаптер), иначе — приветствие. */
  @On('message')
  public async onMessage(@Ctx() ctx: Context): Promise<void> {
    if (ctx.chat?.type !== 'private' || !ctx.from) return;
    const telegramId = ctx.from.id;
    this.logger.log(`message от telegramId=${telegramId}`);

    const user = await this.dialogService.markStarted(
      telegramId,
      this.toUserInfo(ctx),
    );
    const handled = await this.adapter.onMessage(ctx, user);
    if (!handled) await this.sendWelcome(ctx, user);
  }

  // ── Вход через Telegram ─────────────────────────────────────────────────

  private async askLoginConfirmation(
    ctx: Context,
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

Кто-то открыл страницу входа и хочет войти под вашим Telegram-аккаунтом. Подтверждайте, только если это вы сами входите в браузере прямо сейчас.

Если вы не начинали вход — нажмите «Отклонить» и никому не пересылайте эту ссылку.`,
      this.botService.keyboard([
        [
          {
            text: '✅ Подтвердить вход',
            callback_data: `${TELEGRAM_CALLBACK.loginConfirm}${token}`,
          },
        ],
        [
          {
            text: '❌ Отклонить',
            callback_data: `${TELEGRAM_CALLBACK.loginReject}${token}`,
          },
        ],
      ]),
    );
  }

  private async confirmLogin(
    ctx: Context,
    telegramId: number,
    token: string,
  ): Promise<void> {
    if (!this.loginService.isPending(token)) {
      await this.replaceMessage(
        ctx,
        'Ссылка устарела',
        '⏳ Ссылка входа устарела. Обновите QR-код на странице входа.',
      );
      return;
    }
    // Вход создаёт Telegram-аккаунт, если его ещё нет, — так же, как первый заход в мини-приложение
    const user = await this.dialogService.markStarted(
      telegramId,
      this.toUserInfo(ctx),
    );
    await this.loginService.confirm(token, user);
    await this.replaceMessage(
      ctx,
      'Вход подтверждён',
      '✅ Вход подтверждён. Вернитесь в браузер — вход выполнится автоматически.',
    );
  }

  // ── Привязка к веб-аккаунту ─────────────────────────────────────────────

  private async askLinkConfirmation(
    ctx: Context,
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
      `🔗 Привязать этот Telegram-аккаунт к аккаунту ${label}?

После привязки вход через Telegram и уведомления будут работать для этого аккаунта. Если вы не запрашивали привязку или не узнаёте аккаунт — нажмите «Отклонить».`,
      this.botService.keyboard([
        [
          {
            text: '✅ Привязать',
            callback_data: `${TELEGRAM_CALLBACK.linkConfirm}${token}`,
          },
        ],
        [
          {
            text: '❌ Отклонить',
            callback_data: `${TELEGRAM_CALLBACK.linkReject}${token}`,
          },
        ],
      ]),
    );
  }

  private async confirmLink(
    ctx: Context,
    telegramId: number,
    token: string,
  ): Promise<void> {
    const targetUserId = this.linkService.consume(token);
    if (targetUserId === null) {
      await this.replaceMessage(
        ctx,
        'Ссылка устарела',
        '⏳ Ссылка привязки устарела. Запросите новую в профиле веб-версии.',
      );
      return;
    }

    const existingUser = await this.users.findByExternalId(
      'TELEGRAM',
      String(telegramId),
    );
    let linked: MessengerUser;
    try {
      linked = await this.adapter.linkAccount({
        targetUserId,
        telegramUser: this.toUserInfo(ctx) ?? { id: telegramId },
        existingUser,
      });
    } catch (error) {
      this.logger.warn(
        `Привязка telegramId=${telegramId} к userId=${targetUserId} не удалась: ${(error as Error).message}`,
      );
      await this.replaceMessage(
        ctx,
        'Не удалось привязать',
        `⚠️ ${(error as Error).message}`,
      );
      return;
    }

    // При слиянии аккаунтов telegramId переезжает без флага открытого чата — ставим его на итоговую строку
    await this.dialogService.markStarted(telegramId);
    this.logger.log(
      `Telegram telegramId=${telegramId} привязан к userId=${linked.id}`,
    );
    const label =
      (await this.adapter.describeAccount(linked.id)) ?? `#${linked.id}`;
    await this.replaceMessage(
      ctx,
      'Telegram привязан',
      `✅ Telegram привязан к аккаунту ${label}. Уведомления будут приходить в этот чат — не блокируйте бота.`,
      this.botService.keyboard([[this.botService.openAppButton()]]),
    );
  }

  // ── Приветствие и проверка уведомлений ──────────────────────────────────

  private async sendWelcome(
    ctx: Context,
    user: MessengerUser | null,
  ): Promise<void> {
    const links = this.adapter
      .welcomeLinks()
      .map((link) => ({ text: link.text, url: link.url }));
    const linkRows: TelegramKeyboardRow[] = [];
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
            { text: button.text, callback_data: button.payload },
          ]),
        [
          {
            text: '🔔 Проверить уведомления',
            callback_data: TELEGRAM_CALLBACK.notificationsCheck,
          },
        ],
      ]),
    );
  }

  /**
   * Сам клик уже доказывает, что бот не заблокирован. Но если этот telegramId не знаком,
   * уведомления слать некому — не заводим под него пользователя, а просим привязать Telegram.
   */
  private async checkNotifications(
    ctx: Context,
    telegramId: number,
  ): Promise<void> {
    const existing = await this.users.findByExternalId(
      'TELEGRAM',
      String(telegramId),
    );
    if (!existing) {
      await ctx.answerCbQuery('Telegram не привязан к аккаунту');
      await ctx.reply(
        '⚠️ Этот Telegram-аккаунт ещё не привязан к аккаунту в веб-версии — уведомления доставить некуда.',
      );
      return;
    }
    await this.dialogService.markStarted(telegramId);
    await ctx.answerCbQuery('Уведомления подключены');
    await ctx.reply(
      '✅ Уведомления подключены — сюда будут приходить важные события. Не блокируйте бота, иначе доставка остановится.',
    );
  }

  // ── Вспомогательное ─────────────────────────────────────────────────────

  /**
   * Ответ на кнопку с заменой исходного сообщения — кнопки подтверждения исчезают, второй раз
   * не нажать. extra — новые кнопки вместо старых (по умолчанию без кнопок).
   */
  private async replaceMessage(
    ctx: Context,
    notification: string,
    text: string,
    extra?: TelegramSendExtra,
  ): Promise<void> {
    await ctx.answerCbQuery(notification);
    try {
      await ctx.editMessageText(text, {
        reply_markup: extra?.reply_markup as never,
      });
    } catch (error) {
      // Сообщение удалено или его уже нельзя редактировать — результат всё равно нужно показать
      this.logger.debug(
        `Не удалось заменить сообщение: ${(error as Error).message}`,
      );
      await ctx.reply(text, extra);
    }
  }

  private toUserInfo(ctx: Context): TelegramUserInfo | undefined {
    const from = ctx.from;
    if (!from) return undefined;
    return {
      id: from.id,
      first_name: from.first_name,
      last_name: from.last_name,
      username: from.username ?? null,
      language_code: from.language_code,
      is_premium: from.is_premium,
    };
  }
}
