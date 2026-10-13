import { Injectable } from '@nestjs/common';

import {
  BACK_TO_MENU,
  BotContext,
  BotSessionService,
  btn,
  cut,
  localToday,
  msg,
} from '@/bot';
import { LimitationService } from '@/limitation/limitation.service';
import { MessengerMessage } from '@/messengers';
import { PlanDayService } from '@/plan/plan-day.service';
import { ProgramService } from '@/program/program.service';
import { exercisesCount } from '@/program/program.texts';

import {
  completedMessage,
  cooldownMessage,
  previewMessage,
  simpleMessage,
  stepMessage,
} from './workout.texts';
import {
  CompleteResult,
  isDone,
  WorkoutFull,
  WorkoutService,
} from './workout.service';

/**
 * Экраны тренировки: что показать пользователю в ответ на «тренировка сегодня», утреннее «да»
 * или «продолжаю». Общий для обработчика тренировки и опросов.
 */
@Injectable()
export class WorkoutFlow {
  constructor(
    private readonly workouts: WorkoutService,
    private readonly programs: ProgramService,
    private readonly planDays: PlanDayService,
    private readonly limitations: LimitationService,
    private readonly sessions: BotSessionService,
  ) {}

  // ── Сегодня ─────────────────────────────────────────────────────────────

  /** Тренировка на сегодня: начатая, уже засчитанная или предложение комплекса по ротации. */
  public async today(ctx: BotContext): Promise<MessengerMessage> {
    const userId = ctx.user.id;
    const today = localToday(ctx.profile.timeZone);
    for (const result of await this.workouts.autoCloseStale(ctx.profile, today))
      await this.announce(ctx, result);

    const current = await this.workouts.current(userId);
    if (current) return this.show(ctx, current);

    const finished = await this.workouts.finishedOn(userId, today);
    if (finished)
      return msg(
        `Сегодня тренировка уже засчитана: «${finished.complexName}» ✅`,
        [
          [btn('🧘 Показать заминку', `cd:show:${finished.id}`)],
          [btn('🏋️ Ещё одна тренировка', 'wo:pick')],
          [BACK_TO_MENU],
        ],
      );

    const day = await this.planDays.find(userId, today);
    const complex =
      (day?.suggestedComplexId
        ? await this.programs
            .findComplex(userId, day.suggestedComplexId)
            .catch(() => null)
        : null) ?? (await this.programs.nextComplex(userId));
    if (!complex)
      return msg(
        'Нет активной программы с комплексами. Возьми шаблон или собери свою — и я буду выдавать комплексы по кругу.',
        [[btn('📋 Программы', 'pr:list')], [BACK_TO_MENU]],
      );
    return this.offer(ctx, complex.id);
  }

  /** Предложить конкретный комплекс: простой режим — сразу списком, детальный — с кнопкой «Начать». */
  public async offer(
    ctx: BotContext,
    complexId: number,
  ): Promise<MessengerMessage> {
    const complex = await this.programs.findComplex(ctx.user.id, complexId);
    if (!complex.exercises.length)
      return msg(`В комплексе «${complex.name}» пока нет упражнений.`, [
        [btn('✏️ Открыть комплекс', `cx:v:${complex.id}`)],
        [btn('🔀 Другой комплекс', 'wo:pick')],
      ]);
    if (ctx.profile.trackingMode === 'SIMPLE') {
      // Прежний «план на день» заменяется выбранным комплексом
      await this.workouts.discard(ctx.user.id);
      return this.show(ctx, await this.workouts.start(ctx.profile, complex.id));
    }
    const limited = await this.limitations.activeJointIds(ctx.profile);
    return previewMessage(complex, limited);
  }

  /** Список комплексов активной программы для «другой комплекс». */
  public async pick(ctx: BotContext): Promise<MessengerMessage> {
    const complexes = await this.programs.activeComplexes(ctx.user.id);
    if (!complexes.length)
      return msg('В активной программе нет комплексов.', [
        [btn('📋 Программы', 'pr:list')],
      ]);
    return msg('Какой комплекс делаем?', [
      ...complexes.map((c) => [
        btn(
          cut(
            `${c.id === ctx.profile.nextComplexId ? '➡️ ' : ''}${c.name} · ${exercisesCount(c._count.exercises)}`,
            48,
          ),
          `wo:use:${c.id}`,
        ),
      ]),
      [btn('⬅️ Назад', 'wo:today')],
    ]);
  }

  // ── Текущая тренировка ──────────────────────────────────────────────────

  /**
   * Экран начатой тренировки. Детальный режим — шаг с упражнением itemId (по умолчанию первое
   * несделанное) и ожидание ввода подхода.
   */
  public async show(
    ctx: BotContext,
    workout: WorkoutFull,
    itemId?: number,
  ): Promise<MessengerMessage> {
    const limited = await this.limitations.activeJointIds(ctx.profile);
    if (workout.mode === 'SIMPLE') return simpleMessage(workout, limited);
    const item =
      workout.exercises.find((e) => e.id === itemId) ??
      workout.exercises.find((e) => !isDone(e)) ??
      workout.exercises.at(-1);
    if (!item)
      return msg(`В тренировке «${workout.complexName}» нет упражнений.`, [
        [btn('Отменить тренировку', `wo:cancel:${workout.id}`)],
      ]);
    await this.sessions.set(ctx, `wo.set:${item.id}`);
    const last = await this.workouts.lastResult(ctx.user.id, item.exerciseId);
    return stepMessage(workout, item, last, limited);
  }

  // ── Завершение ──────────────────────────────────────────────────────────

  /** Сообщить о засчитанной тренировке и прислать заминку отдельным сообщением. */
  public async announce(
    ctx: BotContext,
    result: CompleteResult,
  ): Promise<void> {
    await this.sessions.clear(ctx);
    await ctx.edit(completedMessage(result));
    await ctx.reply(cooldownMessage(result.cooldown));
  }
}
