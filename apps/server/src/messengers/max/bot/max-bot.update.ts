import { Logger } from '@nestjs/common';
import { type Context } from 'max-io';
import { MessageCreatedUpdate } from 'max-io/types';
import { MaxContext, MaxOn, MaxStarted, MaxUpdate } from 'nestjs-max';

import { MessengerUser, MessengerUserStore } from '../../messenger.types';
import { parseMaxStartPayload } from '../deeplink/max-deeplink.util';
import { MaxLinkService } from '../deeplink/max-link.service';
import { MaxLoginService } from '../deeplink/max-login.service';
import { MaxDialogService } from '../dialog/max-dialog.service';
import { MaxAppAdapter } from '../max-app.adapter';
import { MAX_CALLBACK, MAX_LOG_EMOJI } from '../max.constants';
import { MaxUserInfo } from '../max.types';

import { MaxBotService, MaxKeyboardRow, MaxSendExtra } from './max-bot.service';

/**
 * Обработчики событий бота: открытие/закрытие чата, диплинки входа и привязки, кнопки.
 *
 * Важно про nestjs-max: на один тип апдейта срабатывает только первый зарегистрированный
 * обработчик (next() между ними не вызывается). Поэтому в проекте не должно быть второго
 * @MaxOn('message_callback') / @MaxOn('message_created') — свои кнопки и сообщения проект
 * обрабатывает в MaxAppAdapter.onCallback / onMessage, сюда они долетают первыми.
 */
@MaxUpdate()
export class MaxBotUpdate {
  private readonly logger = new Logger(`${MAX_LOG_EMOJI} ${MaxBotUpdate.name}`);

  constructor(
    private readonly users: MessengerUserStore,
    private readonly botService: MaxBotService,
    private readonly dialogService: MaxDialogService,
    private readonly loginService: MaxLoginService,
    private readonly linkService: MaxLinkService,
    private readonly adapter: MaxAppAdapter,
  ) {}

  // ── События чата ────────────────────────────────────────────────────────

  /** «Начать» в чате или переход по ссылке https://max.ru/<bot>?start=<payload>. */
  @MaxStarted()
  public async onStart(@MaxContext() ctx: Context): Promise<void> {
    // ctx.myId — id самого бота, собеседник — ctx.user
    const maxUserId = ctx.user?.user_id;
    const payload = ctx.startPayload;
    this.logger.log(
      `bot_started от maxId=${maxUserId}, payload=${payload ?? '—'}`,
    );
    if (maxUserId == null) return;

    const user = await this.dialogService.markStarted(maxUserId);

    const intent = parseMaxStartPayload(payload);
    if (intent?.kind === 'login')
      return this.askLoginConfirmation(ctx, intent.token);
    if (intent?.kind === 'link')
      return this.askLinkConfirmation(ctx, intent.token);
    await this.sendWelcome(ctx, user);
  }

  /** Пользователь остановил бота — дальше любая отправка вернёт dialog.not.found. */
  @MaxOn('bot_stopped')
  public async onBotStopped(@MaxContext() ctx: Context): Promise<void> {
    const maxUserId = ctx.user?.user_id;
    this.logger.log(`bot_stopped от maxId=${maxUserId}`);
    if (maxUserId != null) await this.dialogService.markClosed(maxUserId);
  }

  @MaxOn('dialog_removed')
  public async onDialogRemoved(@MaxContext() ctx: Context): Promise<void> {
    const maxUserId = ctx.user?.user_id;
    this.logger.log(`dialog_removed от maxId=${maxUserId}`);
    if (maxUserId != null) await this.dialogService.markClosed(maxUserId);
  }

  // ── Кнопки ──────────────────────────────────────────────────────────────

  @MaxOn('message_callback')
  public async onCallback(@MaxContext() ctx: Context): Promise<void> {
    const maxUserId = ctx.user?.user_id;
    const payload = ctx.callback?.payload ?? '';
    this.logger.log(
      `message_callback от maxId=${maxUserId}, payload=${payload}`,
    );
    if (maxUserId == null) {
      await ctx.answerOnCallback({
        notification: 'Не удалось определить пользователя',
      });
      return;
    }

    try {
      if (payload.startsWith(MAX_CALLBACK.loginConfirm)) {
        return await this.confirmLogin(
          ctx,
          maxUserId,
          payload.slice(MAX_CALLBACK.loginConfirm.length),
        );
      }
      if (payload.startsWith(MAX_CALLBACK.loginReject)) {
        this.loginService.reject(
          payload.slice(MAX_CALLBACK.loginReject.length),
          maxUserId,
        );
        return await this.replaceMessage(
          ctx,
          'Вход отклонён',
          '❌ Вход отклонён. Если вы не запрашивали вход — никому не пересылайте ссылки входа.',
        );
      }
      if (payload.startsWith(MAX_CALLBACK.linkConfirm)) {
        return await this.confirmLink(
          ctx,
          maxUserId,
          payload.slice(MAX_CALLBACK.linkConfirm.length),
        );
      }
      if (payload.startsWith(MAX_CALLBACK.linkReject)) {
        this.linkService.reject(
          payload.slice(MAX_CALLBACK.linkReject.length),
          maxUserId,
        );
        return await this.replaceMessage(
          ctx,
          'Привязка отклонена',
          '❌ Привязка отклонена.',
        );
      }
      if (
        payload === MAX_CALLBACK.notificationsCheck ||
        payload === MAX_CALLBACK.notificationsCheckLegacy
      ) {
        return await this.checkNotifications(ctx, maxUserId);
      }

      // Клик по кнопке доказывает, что чат открыт: MAX доставляет callback только по открытому чату
      const user = await this.dialogService.markStarted(maxUserId);
      const handled = await this.adapter.onCallback(ctx, user);
      if (!handled) {
        this.logger.warn(
          `Кнопка не распознана ни модулем, ни адаптером: payload=${payload}`,
        );
        await ctx.answerOnCallback({ notification: 'Кнопка устарела' });
      }
    } catch (error) {
      this.logger.error(
        `Ошибка обработки кнопки payload=${payload}, maxId=${maxUserId}`,
        (error as Error).stack,
      );
      await ctx.answerOnCallback({
        notification: 'Что-то пошло не так, попробуйте ещё раз',
      });
    }
  }

  // ── Сообщения ───────────────────────────────────────────────────────────

  /** Любое сообщение пользователя: сначала даём шанс проекту (адаптер), иначе — приветствие. */
  @MaxOn('message_created')
  public async onMessage(
    @MaxContext() ctx: Context<MessageCreatedUpdate>,
  ): Promise<void> {
    if (ctx.isMyMessage) return;
    const maxUserId = ctx.message?.sender?.user_id;
    this.logger.log(`message_created от maxId=${maxUserId}`);
    if (maxUserId == null) return;

    const user = await this.dialogService.markStarted(maxUserId);
    const handled = await this.adapter.onMessage(ctx, user);
    if (!handled) await this.sendWelcome(ctx, user);
  }

  // ── Вход через MAX ──────────────────────────────────────────────────────

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

Кто-то открыл страницу входа и хочет войти под вашим MAX-аккаунтом. Подтверждайте, только если это вы сами входите в браузере прямо сейчас.

Если вы не начинали вход — нажмите «Отклонить» и никому не пересылайте эту ссылку.`,
      this.botService.keyboard([
        [
          {
            type: 'callback',
            text: '✅ Подтвердить вход',
            payload: `${MAX_CALLBACK.loginConfirm}${token}`,
            intent: 'positive',
          },
        ],
        [
          {
            type: 'callback',
            text: '❌ Отклонить',
            payload: `${MAX_CALLBACK.loginReject}${token}`,
            intent: 'negative',
          },
        ],
      ]),
    );
  }

  private async confirmLogin(
    ctx: Context,
    maxUserId: number,
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
    // Вход создаёт MAX-аккаунт, если его ещё нет, — так же, как первый заход в мини-приложение
    const user = await this.dialogService.markStarted(maxUserId);
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
      `🔗 Привязать этот MAX-аккаунт к аккаунту ${label}?

После привязки вход через MAX и уведомления будут работать для этого аккаунта. Если вы не запрашивали привязку или не узнаёте аккаунт — нажмите «Отклонить».`,
      this.botService.keyboard([
        [
          {
            type: 'callback',
            text: '✅ Привязать',
            payload: `${MAX_CALLBACK.linkConfirm}${token}`,
            intent: 'positive',
          },
        ],
        [
          {
            type: 'callback',
            text: '❌ Отклонить',
            payload: `${MAX_CALLBACK.linkReject}${token}`,
            intent: 'negative',
          },
        ],
      ]),
    );
  }

  private async confirmLink(
    ctx: Context,
    maxUserId: number,
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
      'MAX',
      String(maxUserId),
    );
    let linked: MessengerUser;
    try {
      linked = await this.adapter.linkAccount({
        targetUserId,
        maxUser: this.toMaxUserInfo(ctx, maxUserId),
        existingUser,
      });
    } catch (error) {
      this.logger.warn(
        `Привязка maxId=${maxUserId} к userId=${targetUserId} не удалась: ${(error as Error).message}`,
      );
      await this.replaceMessage(
        ctx,
        'Не удалось привязать',
        `⚠️ ${(error as Error).message}`,
      );
      return;
    }

    // При слиянии аккаунтов maxId переезжает без флага открытого чата — ставим его на итоговую строку
    await this.dialogService.markStarted(maxUserId);
    this.logger.log(`MAX maxId=${maxUserId} привязан к userId=${linked.id}`);
    const label =
      (await this.adapter.describeAccount(linked.id)) ?? `#${linked.id}`;
    await this.replaceMessage(
      ctx,
      'MAX привязан',
      `✅ MAX привязан к аккаунту ${label}. Уведомления будут приходить в этот чат — не удаляйте его.`,
      // Сюда ведёт и пункт «Открыть в MAX» из веб-версии — без кнопки пользователь упёрся бы в тупик
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
      .map((link) => ({ type: 'link', text: link.text, url: link.url }));
    const linkRows: MaxKeyboardRow[] = [];
    for (let i = 0; i < links.length; i += 2)
      linkRows.push(links.slice(i, i + 2));

    await ctx.reply(
      this.adapter.welcomeText(),
      this.botService.keyboard([
        [this.botService.openAppButton('🚀 Открыть приложение в MAX')],
        ...linkRows,
        ...this.adapter
          .welcomeCallbacks(user)
          .map((button) => [
            { type: 'callback', text: button.text, payload: button.payload },
          ]),
        [
          {
            type: 'callback',
            text: '🔔 Проверить уведомления',
            payload: MAX_CALLBACK.notificationsCheck,
          },
        ],
      ]),
    );
  }

  /**
   * Сам клик уже доказывает, что чат открыт. Но если этот maxId не знаком, уведомления слать
   * некому — не заводим под него пользователя, а просим привязать MAX в веб-версии.
   */
  private async checkNotifications(
    ctx: Context,
    maxUserId: number,
  ): Promise<void> {
    const existing = await this.users.findByExternalId(
      'MAX',
      String(maxUserId),
    );
    if (!existing) {
      await ctx.answerOnCallback({
        notification: 'MAX не привязан к аккаунту',
        message: {
          text: '⚠️ Этот MAX-аккаунт ещё не привязан к аккаунту в веб-версии — уведомления доставить некуда.',
        },
      });
      return;
    }
    await this.dialogService.markStarted(maxUserId);
    await ctx.answerOnCallback({
      notification: 'Уведомления подключены',
      message: {
        text: '✅ Уведомления подключены — сюда будут приходить важные события. Не удаляйте чат, иначе доставка остановится.',
      },
    });
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
    extra?: MaxSendExtra,
  ): Promise<void> {
    await ctx.answerOnCallback({
      notification,
      message: { text, attachments: extra?.attachments ?? [] },
    });
  }

  private toMaxUserInfo(ctx: Context, maxUserId: number): MaxUserInfo {
    const user = ctx.user as
      { name?: string; username?: string | null } | undefined;
    return {
      id: maxUserId,
      name: user?.name,
      username: user?.username ?? null,
    };
  }
}
