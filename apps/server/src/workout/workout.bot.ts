import { Injectable, Logger } from '@nestjs/common';

import {
  mainMenuMessage,
  BACK_TO_MENU,
  BotContext,
  BotFeature,
  BotHandler,
  BotSessionService,
  BotSessionState,
  btn,
  msg,
} from '@/bot';

import { WorkoutFlow } from './workout-flow.service';
import {
  analogsMessage,
  cooldownDoneMessage,
  cooldownMessage,
  leftoversMessage,
  noSetsMessage,
} from './workout.texts';
import { canComplete, isDone, WorkoutService } from './workout.service';

/** Тренировка (`wo`), замена упражнения (`sw`), заминка (`cd`). */
/** Сколько итог «Заминка сделана» остаётся на экране до смены на меню. */
export const COOLDOWN_DONE_SHOW_MS = 2500;

@Injectable()
@BotHandler({ prefixes: ['wo', 'sw', 'cd'], commands: ['today'] })
export class WorkoutBot implements BotFeature {
  private readonly logger = new Logger(`🏋️ ${WorkoutBot.name}`);

  constructor(
    private readonly workouts: WorkoutService,
    private readonly flow: WorkoutFlow,
    private readonly sessions: BotSessionService,
  ) {}

  public async onCommand(ctx: BotContext): Promise<void> {
    await ctx.reply(await this.flow.today(ctx));
  }

  public async onCallback(
    ctx: BotContext,
    prefix: string,
    action: string,
    args: string[],
  ): Promise<void> {
    const userId = ctx.user.id;
    const id = Number(args[0]);

    if (prefix === 'cd') {
      if (action === 'done') {
        await ctx.edit(cooldownDoneMessage());
        // Итог висит пару секунд и сменяется меню. Не ждём здесь: обработчик не должен
        // держать очередь апдейтов мессенджера
        setTimeout(() => {
          ctx
            .edit(mainMenuMessage(ctx.user))
            .catch((error: Error) =>
              this.logger.warn(
                `Меню после заминки не показано: ${error.message}, userId=${userId}`,
              ),
            );
        }, COOLDOWN_DONE_SHOW_MS);
        return;
      }
      const view = await this.workouts.cooldown(userId, id);
      const workout = await this.workouts.find(userId, id);
      // До конца тренировки заминка — предпросмотр: завершать ещё нечего
      await ctx.reply(cooldownMessage(view, workout.status !== 'IN_PROGRESS'));
      return;
    }

    if (prefix === 'sw') return this.onSwap(ctx, action, id, Number(args[1]));

    switch (action) {
      case 'today':
      case 'cont':
        return ctx.edit(await this.flow.today(ctx));
      case 'pick':
        return ctx.edit(await this.flow.pick(ctx));
      case 'use':
        return ctx.edit(await this.flow.offer(ctx, id));
      case 'start': {
        const workout = await this.workouts.start(ctx.profile, id);
        return ctx.edit(await this.flow.show(ctx, workout));
      }
      case 'go': {
        const item = await this.workouts.findItem(userId, id);
        const workout = await this.workouts.find(userId, item.workoutId);
        return ctx.edit(await this.flow.show(ctx, workout, id));
      }
      case 'undo': {
        await this.workouts.undoSet(userId, id);
        const item = await this.workouts.findItem(userId, id);
        const workout = await this.workouts.find(userId, item.workoutId);
        return ctx.edit(await this.flow.show(ctx, workout, id));
      }
      case 'next': {
        const item = await this.workouts.findItem(userId, id);
        // Без подходов не засчитываем и не пропускаем молча — переспрашиваем
        if (!item.sets.length && !item.done)
          return ctx.edit(noSetsMessage(item));
        await this.workouts.markDone(userId, id);
        return this.advance(ctx, id);
      }
      case 'done':
        await this.workouts.markDone(userId, id);
        return this.advance(ctx, id);
      case 'skip':
        return this.advance(ctx, id);
      case 'fin': {
        const workout = await this.workouts.find(userId, id);
        if (workout.status !== 'IN_PROGRESS')
          return ctx.toast('Тренировка уже закрыта');
        if (!canComplete(workout))
          return ctx.edit(
            msg('Пока не сделано ни одного упражнения — засчитывать нечего.', [
              [btn('Продолжить', 'wo:cont')],
              [btn('Отменить тренировку', `wo:cancel:${id}`)],
            ]),
          );
        return this.flow.announce(
          ctx,
          await this.workouts.complete(ctx.profile, id),
        );
      }
      case 'cancel':
        await this.workouts.discard(userId, id);
        await this.sessions.clear(ctx);
        return ctx.edit(
          msg('Тренировка отменена, очередь комплексов не сдвинулась.', [
            [btn('🏋️ Тренировка сегодня', 'wo:today')],
            [BACK_TO_MENU],
          ]),
        );
      default:
        return ctx.toast('Кнопка устарела');
    }
  }

  /** Ввод подхода в детальном режиме: «вес повторы». Нераспознанный ввод ожидание не сбрасывает. */
  public async onText(
    ctx: BotContext,
    session: BotSessionState,
  ): Promise<void> {
    const itemId = Number(session.state.split(':')[1]);
    const workoutId = await this.workouts.addSet(
      ctx.user.id,
      itemId,
      ctx.text ?? '',
    );
    const workout = await this.workouts.find(ctx.user.id, workoutId);
    await ctx.reply(await this.flow.show(ctx, workout, itemId));
  }

  // ── Переход между упражнениями ─────────────────────────────────────────

  /**
   * Что показать после упражнения itemId: следующее несделанное по порядку; всё сделано —
   * тренировка закрывается сама; порядок кончился, а несделанные остались — выбор пользователя.
   */
  private async advance(ctx: BotContext, itemId: number): Promise<void> {
    const userId = ctx.user.id;
    const item = await this.workouts.findItem(userId, itemId);
    const workout = await this.workouts.find(userId, item.workoutId);
    if (workout.status !== 'IN_PROGRESS')
      return ctx.toast('Тренировка уже закрыта');
    if (workout.exercises.every(isDone))
      return this.flow.announce(
        ctx,
        await this.workouts.complete(ctx.profile, workout.id),
      );
    const next = workout.exercises.find(
      (e) => !isDone(e) && e.position > item.position,
    );
    if (next) return ctx.edit(await this.flow.show(ctx, workout, next.id));
    await this.sessions.clear(ctx);
    return ctx.edit(leftoversMessage(workout));
  }

  // ── Замена ──────────────────────────────────────────────────────────────

  private async onSwap(
    ctx: BotContext,
    action: string,
    itemId: number,
    exerciseId: number,
  ): Promise<void> {
    const userId = ctx.user.id;
    switch (action) {
      case 'list': {
        const { item, analogs } = await this.workouts.analogs(
          ctx.profile,
          itemId,
        );
        return ctx.edit(analogsMessage(itemId, item.exercise.name, analogs));
      }
      case 'pick':
        return ctx.edit(
          msg('Заменить только сегодня или в комплексе?', [
            [
              btn('Только сегодня', `sw:day:${itemId}:${exerciseId}`),
              btn('В комплексе', `sw:cx:${itemId}:${exerciseId}`),
            ],
            [btn('⬅️ К тренировке', 'wo:cont')],
          ]),
        );
      case 'day':
      case 'cx': {
        const workoutId = await this.workouts.replace(
          userId,
          itemId,
          exerciseId,
          action === 'cx',
        );
        await ctx.toast(
          action === 'cx' ? 'Заменено в комплексе' : 'Заменено на сегодня',
        );
        const workout = await this.workouts.find(userId, workoutId);
        return ctx.edit(await this.flow.show(ctx, workout, itemId));
      }
      default:
        return ctx.toast('Кнопка устарела');
    }
  }
}
