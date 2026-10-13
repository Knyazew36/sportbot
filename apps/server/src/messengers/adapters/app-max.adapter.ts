import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import type { Context } from 'max-io';
import { PrismaService } from 'prisma/prisma.service';

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
  MaxAppAdapter,
  MaxBotService,
  MaxMessengerChannel,
  MaxUserInfo,
  MaxWebSession,
} from '@/messengers/max';

import { AppMessengerAccountsService } from './app-messenger-accounts.service';

/**
 * Связка модуля MAX (src/messengers/max) с этим проектом: сессии, слияние аккаунтов и сборка
 * BotContext из апдейта с передачей в BotRouter. Зеркало AppTelegramAdapter.
 */
@Injectable()
export class AppMaxAdapter
  extends MaxAppAdapter
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(`🟣 ${AppMaxAdapter.name}`);

  constructor(
    private readonly accounts: AppMessengerAccountsService,
    private readonly prisma: PrismaService,
    private readonly router: BotRouter,
    private readonly sender: BotSender,
    private readonly botService: MaxBotService,
    private readonly channel: MaxMessengerChannel,
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

  public async issueWebSession(user: MessengerUser): Promise<MaxWebSession> {
    return this.accounts.issueWebSession(user);
  }

  public linkAccount(params: {
    targetUserId: number;
    maxUser: MaxUserInfo;
    existingUser: MessengerUser | null;
  }): Promise<MessengerUser> {
    return this.accounts.linkAccount({
      channel: 'MAX',
      targetUserId: params.targetUserId,
      externalId: String(params.maxUser.id),
      profile: params.maxUser,
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
    await this.run(ctx, user, {
      kind: 'callback',
      payload: ctx.callback?.payload ?? '',
    });
    return true;
  }

  public async onMessage(
    ctx: Context,
    user: MessengerUser | null,
  ): Promise<boolean> {
    if (!user) return false;
    const body = ctx.message?.body;
    const file = (
      (body?.attachments ?? []) as Array<{
        type: string;
        filename?: string;
        size?: number;
        payload?: { url?: string };
      }>
    ).find((attachment) => attachment.type === 'file');
    if (file?.payload?.url) {
      const url = file.payload.url;
      const document: BotDocument = {
        fileName: file.filename ?? 'file',
        size: file.size ?? 0,
        download: async () =>
          Buffer.from(await (await fetch(url)).arrayBuffer()),
      };
      await this.run(ctx, user, { kind: 'document', document });
      return true;
    }
    await this.run(ctx, user, { kind: 'text', text: body?.text ?? '' });
    return true;
  }

  // ── BotContext ──────────────────────────────────────────────────────────

  private async run(
    ctx: Context,
    user: MessengerUser,
    part: Pick<BotContext, 'kind'> & Partial<BotContext>,
  ): Promise<void> {
    await this.rememberProfile(ctx, user);
    const botUser = (await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { sportProfile: true },
    })) as BotUser;
    const isCallback = part.kind === 'callback';
    let answered = false;

    const reply = (message: MessengerMessage) =>
      this.sender.sendVia('MAX', botUser, message);

    const botContext: BotContext = {
      channel: 'MAX',
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
          // Первый ответ на нажатие — заменой сообщения; после всплывашки ответ уже потрачен
          if (answered) await this.channel.callbackMessage(ctx).edit(message);
          else {
            answered = true;
            await this.channel.answerWithMessage(ctx, message);
          }
        } catch {
          // Сообщение старше 7 суток или удалено — показываем результат новым
          await reply(message);
        }
      },
      remove: async () => {
        if (!isCallback) return false;
        try {
          return (await ctx.deleteMessage()).success;
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
        await ctx.answerOnCallback({ notification: text });
      },
    };

    await this.router.handle(botContext);
  }

  /**
   * Имя и ник из апдейта бота → maxData. Слой MAX профиль из апдейтов не сохраняет, а по нику
   * определяется администратор (ADMIN_MAX_USERNAME) и берётся имя для нового профиля.
   */
  private async rememberProfile(
    ctx: Context,
    user: MessengerUser,
  ): Promise<void> {
    const sender = ctx.user as
      { name?: string; username?: string | null } | undefined;
    if (!sender) return;
    const stored = (user.maxData ?? {}) as { name?: string; username?: string };
    const username = sender.username ?? undefined;
    if (stored.name === sender.name && stored.username === username) return;
    await this.prisma.user.update({
      where: { id: user.id },
      data: { maxData: { ...stored, name: sender.name, username } },
    });
  }
}
