import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import type { Context } from 'telegraf';

import {
  BOT_COMMANDS,
  BotContext,
  BotDocument,
  BotRouter,
  BotSender,
  BotUser,
} from '@/bot';
import { MessengerMessage, MessengerUser, plainText } from '@/messengers';
import {
  TelegramAppAdapter,
  TelegramBotService,
  TelegramMessengerChannel,
  TelegramUserInfo,
  TelegramWebSession,
} from '@/messengers/telegram';

import { AppMessengerAccountsService } from './app-messenger-accounts.service';

/**
 * Связка модуля Telegram (src/messengers/telegram) с этим проектом: сессии, слияние аккаунтов
 * и главное — сборка BotContext из апдейта и передача его в BotRouter. Зеркало AppMaxAdapter.
 */
@Injectable()
export class AppTelegramAdapter
  extends TelegramAppAdapter
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(`✈️ ${AppTelegramAdapter.name}`);

  constructor(
    private readonly accounts: AppMessengerAccountsService,
    private readonly prisma: PrismaService,
    private readonly router: BotRouter,
    private readonly sender: BotSender,
    private readonly botService: TelegramBotService,
    private readonly channel: TelegramMessengerChannel,
  ) {
    super();
  }

  public onApplicationBootstrap(): void {
    this.botService
      .setCommands([...BOT_COMMANDS])
      .catch((error: Error) =>
        this.logger.warn(`Меню команд не обновлено: ${error.message}`),
      );
  }

  // ── Сессии и аккаунты ───────────────────────────────────────────────────

  public async issueWebSession(
    user: MessengerUser,
  ): Promise<TelegramWebSession> {
    return this.accounts.issueWebSession(user);
  }

  public linkAccount(params: {
    targetUserId: number;
    telegramUser: TelegramUserInfo;
    existingUser: MessengerUser | null;
  }): Promise<MessengerUser> {
    return this.accounts.linkAccount({
      channel: 'TELEGRAM',
      targetUserId: params.targetUserId,
      externalId: String(params.telegramUser.id),
      profile: params.telegramUser,
      existingUser: params.existingUser,
    });
  }

  public describeAccount(userId: number): Promise<string | null> {
    return this.accounts.describeAccount(userId);
  }

  // ── События бота ────────────────────────────────────────────────────────

  public async onStart(
    ctx: Context,
    user: MessengerUser,
    payload: string | undefined,
  ): Promise<boolean> {
    await this.run(ctx, user, {
      kind: 'command',
      command: 'start',
      startPayload: payload,
    });
    return true;
  }

  public async onCommand(
    ctx: Context,
    user: MessengerUser,
    command: string,
  ): Promise<boolean> {
    await this.run(ctx, user, { kind: 'command', command });
    return true;
  }

  public async onCallback(
    ctx: Context,
    user: MessengerUser | null,
  ): Promise<boolean> {
    if (!user) return false;
    const query = ctx.callbackQuery;
    const payload = query && 'data' in query ? query.data : '';
    await this.run(ctx, user, { kind: 'callback', payload });
    return true;
  }

  public async onMessage(
    ctx: Context,
    user: MessengerUser | null,
  ): Promise<boolean> {
    if (!user) return false;
    const message = ctx.message;
    if (message && 'document' in message) {
      const file = message.document;
      const document: BotDocument = {
        fileName: file.file_name ?? 'file',
        size: file.file_size ?? 0,
        download: async () => {
          const url = await this.botService.getFileUrl(file.file_id);
          return Buffer.from(await (await fetch(url)).arrayBuffer());
        },
      };
      await this.run(ctx, user, { kind: 'document', document });
      return true;
    }
    const text = message && 'text' in message ? message.text : '';
    await this.run(ctx, user, { kind: 'text', text });
    return true;
  }

  // ── BotContext ──────────────────────────────────────────────────────────

  private async run(
    ctx: Context,
    user: MessengerUser,
    part: Pick<BotContext, 'kind'> & Partial<BotContext>,
  ): Promise<void> {
    const botUser = (await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { sportProfile: true },
    })) as BotUser;
    const isCallback = part.kind === 'callback';
    let answered = false;

    const reply = (message: MessengerMessage) =>
      this.sender.sendVia('TELEGRAM', botUser, message);

    const botContext: BotContext = {
      channel: 'TELEGRAM',
      user: botUser,
      profile: botUser.sportProfile!,
      ...part,
      reply,
      edit: async (message) => {
        if (!isCallback || message.image) {
          await reply(message);
          return;
        }
        try {
          await this.channel.callbackMessage(ctx).edit(message);
        } catch (error) {
          // Тот же текст и кнопки — правка не нужна; иначе сообщение недоступно, шлём новое
          if ((error as Error).message.includes('message is not modified'))
            return;
          await reply(message);
        }
      },
      remove: async () => {
        if (!isCallback) return false;
        try {
          await ctx.deleteMessage();
          return true;
        } catch (error) {
          this.logger.debug(
            `Сообщение не удалено: ${(error as Error).message}, userId=${botUser.id}`,
          );
          return false;
        }
      },
      toast: async (raw) => {
        const text = plainText(raw);
        if (!isCallback || answered) {
          await reply({ text });
          return;
        }
        answered = true;
        await ctx.answerCbQuery(text.slice(0, 190));
      },
    };

    await this.router.handle(botContext);
    // Без ответа на callback_query у кнопки крутятся «часики»
    if (isCallback && !answered)
      await ctx.answerCbQuery().catch(() => undefined);
  }
}
