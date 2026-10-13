import { Injectable } from '@nestjs/common';

import {
  BotContext,
  BotFeature,
  BotHandler,
  btn,
  fmtShort,
  msg,
  hint,
} from '@/bot';
import { PlanDayStatus } from '@/generated/prisma/client';
import { MessengerButton, MessengerMessage } from '@/messengers';
import { WorkoutFlow } from '@/workout/workout-flow.service';

import { FIX_WINDOW_DAYS, PollService } from './poll.service';

const STATUS_TITLE: Record<PlanDayStatus, string> = {
  DONE: '✅ тренировка',
  MISSED: '❌ пропуск',
  PENDING: '⏳ ожидает ответа',
  PAUSED: '⏸ пауза',
};

/** День плана: ответы на утренний и вечерний вопрос, перенос, исправление отметок. */
@Injectable()
@BotHandler({ prefixes: ['pd'], commands: ['history'] })
export class PlanBot implements BotFeature {
  constructor(
    private readonly polls: PollService,
    private readonly flow: WorkoutFlow,
  ) {}

  public async onCommand(ctx: BotContext): Promise<void> {
    await ctx.reply(await this.historyScreen(ctx));
  }

  public async onCallback(
    ctx: BotContext,
    _prefix: string,
    action: string,
    args: string[],
  ): Promise<void> {
    const userId = ctx.user.id;
    const dayId = Number(args[0]);
    const yes = args[1] === 'y';

    switch (action) {
      case 'hist':
        return ctx.edit(await this.historyScreen(ctx));

      case 'am': {
        const day = await this.polls.answer(
          userId,
          dayId,
          'morning',
          yes ? 'YES' : 'NO',
        );
        if (!day) return ctx.toast('Кнопка устарела');
        if (yes) return ctx.edit(await this.flow.today(ctx));
        return this.sendAll(ctx, await this.polls.miss(ctx.profile, dayId));
      }

      case 'pm': {
        const day = await this.polls.answer(
          userId,
          dayId,
          'evening',
          yes ? 'YES' : 'NO',
        );
        if (!day) return ctx.toast('Кнопка устарела');
        if (yes)
          return this.flow.announce(
            ctx,
            await this.polls.confirmDone(ctx.profile, day),
          );
        return this.sendAll(ctx, await this.polls.miss(ctx.profile, dayId));
      }

      case 'rs':
        if (!yes) return ctx.edit(msg('Хорошо, без напоминания.'));
        await this.polls.reschedule(ctx.profile, dayId);
        return ctx.edit(msg('Напомню завтра утром.'));

      case 'fix':
        if (args[1] === 'd') {
          const result = await this.polls.fixToDone(ctx.profile, dayId);
          await ctx.toast(`Отметил тренировку. Серия: ${result.currentStreak}`);
        } else {
          await this.polls.fixToMissed(ctx.profile, dayId);
          await ctx.toast('Отметил пропуск');
        }
        return ctx.edit(await this.historyScreen(ctx));

      default:
        return ctx.toast('Кнопка устарела');
    }
  }

  // ── Экраны ──────────────────────────────────────────────────────────────

  /** Первое сообщение — правкой вопроса (кнопки исчезают), остальные — новыми. */
  private async sendAll(
    ctx: BotContext,
    messages: MessengerMessage[],
  ): Promise<void> {
    if (!messages.length) return ctx.toast('Кнопка устарела');
    await ctx.edit(messages[0]);
    for (const message of messages.slice(1)) await ctx.reply(message);
  }

  private async historyScreen(ctx: BotContext): Promise<MessengerMessage> {
    const days = await this.polls.history(ctx.profile);
    if (!days.length)
      return msg(
        `За последние ${FIX_WINDOW_DAYS} дней тренировочных дней не было.`,
        [[btn('⬅️ Настройки', 'st:menu')]],
      );
    const rows: MessengerButton[][] = [];
    for (const day of days) {
      const label = fmtShort(day.date);
      if (day.status === 'MISSED' || day.status === 'PENDING')
        rows.push([btn(`${label}: была тренировка`, `pd:fix:${day.id}:d`)]);
      if (day.status === 'DONE' || day.status === 'PENDING')
        rows.push([btn(`${label}: был пропуск`, `pd:fix:${day.id}:m`)]);
    }
    return msg(
      [
        `Отметки за ${FIX_WINDOW_DAYS} дней.`,
        hint('Ошибся — исправь кнопкой.'),
        '',
        ...days.map(
          (day) => `${fmtShort(day.date)} — ${STATUS_TITLE[day.status]}`,
        ),
      ].join('\n'),
      [...rows, [btn('⬅️ Настройки', 'st:menu')]],
    );
  }
}
