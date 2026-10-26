import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { addDays, localToday } from '@/bot';
import {
  defaultPlan,
  isTimed,
  MEASURE_LIMITS,
  parseTime,
} from '@/catalog/measure';
import {
  ExerciseMeasure,
  Prisma,
  SportProfile,
  TrackingMode,
  WorkoutStatus,
} from '@/generated/prisma/client';
import { LimitationService } from '@/limitation/limitation.service';
import { PlanDayService } from '@/plan/plan-day.service';
import { ProgramService } from '@/program/program.service';
import { resolveWarmup } from '@/program/warmup';

import { CooldownService, CooldownView } from './cooldown.service';

export const WORKOUT_INCLUDE = {
  exercises: {
    orderBy: { position: 'asc' },
    include: {
      sets: { orderBy: { number: 'asc' } },
      exercise: {
        include: {
          muscles: { include: { muscle: true } },
          joints: { include: { joint: true } },
        },
      },
    },
  },
} satisfies Prisma.WorkoutInclude;

export type WorkoutFull = Prisma.WorkoutGetPayload<{
  include: typeof WORKOUT_INCLUDE;
}>;
export type WorkoutExerciseFull = WorkoutFull['exercises'][number];

export interface CompleteResult {
  userId: number;
  workoutId: number;
  complexName: string;
  cardioName: string | null;
  cardioMinutes: number | null;
  auto: boolean;
  currentStreak: number;
  cooldown: CooldownView;
}

/** Время подхода с клиента. */
export interface SetTiming {
  doneAt?: Date;
  workSeconds?: number;
  restTargetSeconds?: number;
}

export interface LastResult {
  date: Date;
  sets: { weight: number; reps: number }[];
}

const ANALOGS_LIMIT = 8;

/** Упражнение сделано, если записан хотя бы один подход или нажато «Готово». */
export const isDone = (item: WorkoutExerciseFull): boolean =>
  item.done || item.sets.length > 0;

/** Детальная тренировка засчитывается, если сделано хотя бы одно упражнение (business-tz, 7.3). */
export const canComplete = (workout: WorkoutFull): boolean =>
  workout.mode !== 'DETAILED' || workout.exercises.some(isDone);

export interface WorkoutTotals {
  minutes: number;
  exercisesDone: number;
  exercisesTotal: number;
  sets: number;
  /** Поднято за тренировку, кг (вес × повторы). */
  tonnage: number;
}

/** Цифры итога: общие для экрана итога, карточки «Поделиться» и страницы результата. */
export function workoutTotals(workout: WorkoutFull): WorkoutTotals {
  const sets = workout.exercises.flatMap((e) => e.sets);
  const end = workout.finishedAt ?? new Date();
  return {
    minutes: Math.max(
      1,
      Math.round((end.getTime() - workout.startedAt.getTime()) / 60_000),
    ),
    exercisesDone: workout.exercises.filter(isDone).length,
    exercisesTotal: workout.exercises.length,
    sets: sets.length,
    tonnage: Math.round(
      sets.reduce((sum, s) => sum + Number(s.weight) * s.reps, 0),
    ),
  };
}

/**
 * Границы ввода подхода — как в боте: вес 0..999 кг (0 — без веса), повторы 1..999.
 * На время вес не пишется, а reps — секунды до 4 часов.
 */
const isValidSet = (
  measure: ExerciseMeasure,
  weight: number,
  reps: number,
): boolean =>
  Number.isFinite(weight) &&
  weight >= 0 &&
  weight <= 999 &&
  Number.isInteger(reps) &&
  reps >= 1 &&
  reps <= MEASURE_LIMITS[measure].set;

const setError = (measure: ExerciseMeasure) =>
  isTimed(measure)
    ? 'Время — от 1 секунды до 4 часов.'
    : 'Вес до 999 кг, повторы от 1 до 999.';

@Injectable()
export class WorkoutService {
  private readonly logger = new Logger(`🏋️ ${WorkoutService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly programs: ProgramService,
    private readonly planDays: PlanDayService,
    private readonly cooldowns: CooldownService,
    private readonly limitations: LimitationService,
  ) {}

  // ── Чтение ──────────────────────────────────────────────────────────────

  public async find(userId: number, workoutId: number): Promise<WorkoutFull> {
    const workout = await this.prisma.workout.findFirst({
      where: { id: workoutId, userId },
      include: WORKOUT_INCLUDE,
    });
    if (!workout) throw new NotFoundException('Тренировка не найдена.');
    return workout;
  }

  /** Незавершённая тренировка пользователя (она может быть только одна). */
  public async current(userId: number): Promise<WorkoutFull | null> {
    return this.prisma.workout.findFirst({
      where: { userId, status: 'IN_PROGRESS' },
      orderBy: { id: 'desc' },
      include: WORKOUT_INCLUDE,
    });
  }

  public async finishedOn(userId: number, date: Date) {
    return this.prisma.workout.findFirst({
      where: { userId, date, status: { in: ['FINISHED', 'AUTO_CLOSED'] } },
      orderBy: { id: 'desc' },
    });
  }

  public async findItem(userId: number, itemId: number) {
    const item = await this.prisma.workoutExercise.findFirst({
      where: { id: itemId, workout: { userId } },
      include: {
        workout: true,
        sets: { orderBy: { number: 'asc' } },
        exercise: {
          include: {
            muscles: { include: { muscle: true } },
            joints: { include: { joint: true } },
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Упражнение тренировки не найдено.');
    return item;
  }

  /** Прошлый результат: последняя завершённая тренировка пользователя с этим упражнением. */
  public async lastResult(
    userId: number,
    exerciseId: number,
  ): Promise<LastResult | null> {
    const item = await this.prisma.workoutExercise.findFirst({
      where: {
        exerciseId,
        sets: { some: {} },
        workout: { userId, status: { in: ['FINISHED', 'AUTO_CLOSED'] } },
      },
      orderBy: [{ workout: { date: 'desc' } }, { id: 'desc' }],
      include: {
        sets: { orderBy: { number: 'asc' } },
        workout: { select: { date: true } },
      },
    });
    if (!item) return null;
    return {
      date: item.workout.date,
      sets: item.sets.map((s) => ({ weight: Number(s.weight), reps: s.reps })),
    };
  }

  // ── Начало ──────────────────────────────────────────────────────────────

  /**
   * Создать тренировку по комплексу. Вторая незавершённая не создаётся — возвращается начатая.
   */
  public async start(
    profile: SportProfile,
    complexId: number,
    date = localToday(profile.timeZone),
  ): Promise<WorkoutFull> {
    const existing = await this.current(profile.userId);
    if (existing) return existing;
    return this.create(profile, complexId, date, 'DETAILED');
  }

  /** Отменить незавершённую тренировку (смена комплекса, отказ). */
  public async discard(userId: number, workoutId?: number): Promise<void> {
    const { count } = await this.prisma.workout.deleteMany({
      where: {
        userId,
        status: 'IN_PROGRESS',
        ...(workoutId ? { id: workoutId } : {}),
      },
    });
    if (count)
      this.logger.log(`Незавершённая тренировка удалена: userId=${userId}`);
  }

  /**
   * Удалить закрытую тренировку из истории. День, который она закрыла, освобождается — иначе
   * в календаре останется «тренировка» без тренировки. Пропуском он становится, только если срок
   * ответа уже вышел; сегодняшний, вчерашний и будущий (его закрывает внеплановая) снова ждут
   * тренировки, а пропуск им при необходимости поставит крон. Очередь комплексов не откатывается.
   */
  public async remove(profile: SportProfile, workoutId: number): Promise<void> {
    const { userId } = profile;
    // Та же граница, что у крона просроченных дней
    const answerFrom = addDays(localToday(profile.timeZone), -1);
    await this.prisma.$transaction(async (tx) => {
      await tx.planDay.updateMany({
        where: { userId, workoutId, date: { lt: answerFrom } },
        data: { status: 'MISSED', workoutId: null },
      });
      await tx.planDay.updateMany({
        where: { userId, workoutId, date: { gte: answerFrom } },
        data: { status: 'PENDING', workoutId: null },
      });
      const { count } = await tx.workout.deleteMany({
        where: { id: workoutId, userId, status: { not: 'IN_PROGRESS' } },
      });
      if (!count) throw new NotFoundException('Тренировка не найдена.');
      await this.planDays.recalcStreak(userId, tx);
    });
    this.logger.log(
      `Тренировка удалена: workoutId=${workoutId}, userId=${userId}`,
    );
  }

  // ── Подходы ─────────────────────────────────────────────────────────────

  /**
   * Подход из ввода «вес повторы»: «22 10», «22.5 10», «22,5х10»; только повторы («12») —
   * упражнение без веса.
   */
  public async addSet(userId: number, itemId: number, input: string) {
    const item = await this.findItem(userId, itemId);
    // В чате подход пишется только в идущую тренировку: прошедшие правятся в приложении
    if (item.workout.status !== 'IN_PROGRESS')
      throw new BadRequestException('Тренировка уже закрыта.');
    const { measure } = item.exercise;
    if (isTimed(measure)) {
      const seconds = parseTime(measure, input);
      if (seconds === null || !isValidSet(measure, 0, seconds))
        throw new BadRequestException(
          measure === 'MINUTES'
            ? 'Не понял. Напиши минуты: 20 — это 20 минут, 20:30 — двадцать с половиной.'
            : 'Не понял. Напиши время: 45 — это 45 секунд, 1:30 — полторы минуты.',
        );
      return this.createSet(item, 0, seconds);
    }
    const match =
      /^\s*(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:(?:[xх×*]|\s)\s*(\d{1,3}))?\s*$/i.exec(
        input,
      );
    const first = match ? Number(match[1].replace(',', '.')) : NaN;
    const weight = match?.[2] ? first : 0;
    const reps = match?.[2] ? Number(match[2]) : first;
    if (!match || !isValidSet('REPS', weight, reps))
      throw new BadRequestException(
        'Не понял. Напиши вес и повторы, например:\n60 10\nДробный вес — через точку: 22.5 10\nБез веса — только повторы: 10',
      );
    return this.createSet(item, weight, reps);
  }

  /**
   * Подход из приложения: вес отдельно от повторов, 0 — без веса. Можно и в прошедшую
   * тренировку — исправление из статистики.
   */
  public async addSetValues(
    userId: number,
    itemId: number,
    weight: number,
    reps: number,
    clientId?: string,
    timing: SetTiming = {},
  ): Promise<number> {
    const item = await this.findItem(userId, itemId);
    const { measure } = item.exercise;
    // На время вес не пишется, даже если клиент его прислал
    const setWeight = isTimed(measure) ? 0 : weight;
    if (!isValidSet(measure, setWeight, reps))
      throw new BadRequestException(setError(measure));
    if (item.workout.mode === 'SIMPLE')
      throw new BadRequestException(
        'В простом режиме подходы не записываются.',
      );
    return this.createSet(item, setWeight, reps, clientId, timing);
  }

  /** Исправить сохранённый подход — в идущей или прошедшей тренировке (frontend-tz, 8.2). */
  public async updateSet(
    userId: number,
    setId: number,
    weight: number,
    reps: number,
  ): Promise<number> {
    const set = await this.ownedSet(userId, setId);
    const { measure } = set.workoutExercise.exercise;
    const setWeight = isTimed(measure) ? 0 : weight;
    if (!isValidSet(measure, setWeight, reps))
      throw new BadRequestException(setError(measure));
    await this.prisma.workoutSet.update({
      where: { id: setId },
      data: { weight: setWeight, reps },
    });
    this.logger.log(`Подход исправлен: setId=${setId}, userId=${userId}`);
    return set.workoutExercise.workoutId;
  }

  /** Удалить любой подход, в том числе прошедшей тренировки; номера оставшихся сдвигаются. */
  public async deleteSet(userId: number, setId: number): Promise<number> {
    const set = await this.ownedSet(userId, setId);
    await this.prisma.$transaction([
      this.prisma.workoutSet.delete({ where: { id: setId } }),
      this.prisma.workoutSet.updateMany({
        where: {
          workoutExerciseId: set.workoutExerciseId,
          number: { gt: set.number },
        },
        data: { number: { decrement: 1 } },
      }),
    ]);
    this.logger.log(`Подход удалён: setId=${setId}, userId=${userId}`);
    return set.workoutExercise.workoutId;
  }

  public async undoSet(userId: number, itemId: number): Promise<void> {
    const item = await this.findItem(userId, itemId);
    const last = item.sets.at(-1);
    if (!last || item.workout.status !== 'IN_PROGRESS') return;
    await this.prisma.workoutSet.delete({ where: { id: last.id } });
  }

  public async markDone(userId: number, itemId: number): Promise<number> {
    const item = await this.findItem(userId, itemId);
    if (item.workout.status !== 'IN_PROGRESS')
      throw new BadRequestException('Тренировка уже закрыта.');
    await this.prisma.workoutExercise.update({
      where: { id: itemId },
      data: { done: true },
    });
    return item.workoutId;
  }

  // ── Засчитывание ────────────────────────────────────────────────────────

  /**
   * Единая точка засчитывания тренировки (раздел 25.4 ТЗ): статус, день плана, ротация, серия,
   * заминка — одной транзакцией. Меняет только тренировку в IN_PROGRESS: повторное нажатие
   * получает отказ, а не второе засчитывание.
   */
  public async complete(
    profile: SportProfile,
    workoutId: number,
    options: { auto?: boolean; forDayId?: number; finishedAt?: Date } = {},
  ): Promise<CompleteResult> {
    const userId = profile.userId;
    const status: WorkoutStatus = options.auto ? 'AUTO_CLOSED' : 'FINISHED';
    const result = await this.prisma.$transaction(
      async (tx) => {
        const { count } = await tx.workout.updateMany({
          where: { id: workoutId, userId, status: 'IN_PROGRESS' },
          data: { status, finishedAt: options.finishedAt ?? new Date() },
        });
        if (!count) throw new BadRequestException('Тренировка уже закрыта.');
        const workout = await tx.workout.findUniqueOrThrow({
          where: { id: workoutId },
        });
        const detailed = workout.mode === 'DETAILED';
        // Детальный: сделано то, где есть подходы; простой — весь комплекс по плану
        await tx.workoutExercise.updateMany({
          where: {
            workoutId,
            done: false,
            ...(detailed ? { sets: { some: {} } } : {}),
          },
          data: { done: true },
        });
        const unplanned = await this.planDays.bindWorkout(
          tx,
          userId,
          workout,
          profile.trainingDays,
          options.forDayId,
        );
        if (unplanned)
          await tx.workout.update({
            where: { id: workoutId },
            data: { unplanned: true },
          });
        await this.programs.advance(tx, userId, workout.complexId);
        await tx.sportProfile.update({
          where: { userId },
          data: { missedInRow: 0 },
        });
        const { currentStreak } = await this.planDays.recalcStreak(userId, tx);
        const cooldown = await this.cooldowns.build(
          workoutId,
          userId,
          detailed,
          tx,
        );
        return {
          complexName: workout.complexName,
          cardioName: workout.cardioName,
          cardioMinutes: workout.cardioMinutes,
          currentStreak,
          cooldown,
        };
      },
      { timeout: 20_000 },
    );
    this.logger.log(
      `Тренировка засчитана: workoutId=${workoutId}, userId=${userId}, статус=${status}, серия=${result.currentStreak}`,
    );
    return { userId, workoutId, auto: !!options.auto, ...result };
  }

  /**
   * Засчитать тренировку без «процесса»: вечернее «да» или исправление отметки. Берётся начатый
   * план на эту дату, иначе создаётся запись без подходов (SIMPLE) по комплексу.
   */
  public async completeFromPlan(
    profile: SportProfile,
    date: Date,
    complexId: number | null,
    forDayId?: number,
  ): Promise<CompleteResult> {
    const userId = profile.userId;
    let workout: { id: number } | null = await this.prisma.workout.findFirst({
      where: { userId, date, status: 'IN_PROGRESS' },
      select: { id: true },
    });
    if (!workout) {
      const complex =
        (complexId
          ? await this.prisma.complex.findFirst({
              where: { id: complexId, program: { ownerId: userId } },
              select: { id: true },
            })
          : null) ?? (await this.programs.nextComplex(userId));
      // Напрямую, мимо start(): незавершённая тренировка другого дня остаётся нетронутой
      workout = complex
        ? await this.create(profile, complex.id, date, 'SIMPLE')
        : await this.prisma.workout.create({
            data: { userId, date, mode: 'SIMPLE', complexName: 'Тренировка' },
            select: { id: true },
          });
    }
    return this.complete(profile, workout.id, { forDayId });
  }

  /**
   * Закрытие незавершённых тренировок прошлых дней. Детальная с хотя бы одним сделанным
   * упражнением засчитывается как AUTO_CLOSED; остальное удаляется — день остаётся ждать ответа.
   */
  public async autoCloseStale(
    profile: SportProfile,
    today = localToday(profile.timeZone),
  ): Promise<CompleteResult[]> {
    const stale = await this.prisma.workout.findMany({
      where: {
        userId: profile.userId,
        status: 'IN_PROGRESS',
        date: { lt: today },
      },
      include: WORKOUT_INCLUDE,
    });
    const results: CompleteResult[] = [];
    for (const workout of stale) {
      if (workout.mode === 'DETAILED' && workout.exercises.some(isDone)) {
        results.push(await this.complete(profile, workout.id, { auto: true }));
      } else {
        await this.discard(profile.userId, workout.id);
      }
    }
    return results;
  }

  /** Исправление отметки DONE → MISSED: простая тренировка удаляется, детальная отвязывается. */
  public async detachFromDay(userId: number, workoutId: number): Promise<void> {
    await this.prisma.workout.deleteMany({
      where: { id: workoutId, userId, mode: 'SIMPLE' },
    });
    this.logger.log(
      `Тренировка отвязана от дня: workoutId=${workoutId}, userId=${userId}`,
    );
  }

  // ── Замена ──────────────────────────────────────────────────────────────

  /**
   * Аналоги: упражнения с общей основной мышцей. Исключаются уже стоящие в тренировке,
   * а при действующих ограничениях — нагружающие любую из отмеченных зон.
   */
  public async analogs(profile: SportProfile, itemId: number) {
    const userId = profile.userId;
    const item = await this.findItem(userId, itemId);
    const primaryIds = item.exercise.muscles
      .filter((m) => m.role === 'PRIMARY')
      .map((m) => m.muscleId);
    const inWorkout = await this.prisma.workoutExercise.findMany({
      where: { workoutId: item.workoutId },
      select: { exerciseId: true },
    });
    const limited = [...(await this.limitations.activeJointIds(profile))];
    const candidates = await this.prisma.exercise.findMany({
      where: {
        id: { notIn: inWorkout.map((e) => e.exerciseId) },
        OR: [{ status: 'CATALOG' }, { status: 'DRAFT', authorId: userId }],
        muscles: { some: { role: 'PRIMARY', muscleId: { in: primaryIds } } },
        ...(limited.length
          ? { joints: { none: { jointId: { in: limited } } } }
          : {}),
      },
      include: { muscles: { include: { muscle: true } } },
    });
    const matched = (exercise: (typeof candidates)[number]) =>
      exercise.muscles.filter(
        (m) => m.role === 'PRIMARY' && primaryIds.includes(m.muscleId),
      ).length;
    return {
      item,
      analogs: candidates
        .sort(
          (a, b) =>
            matched(b) - matched(a) || a.name.localeCompare(b.name, 'ru'),
        )
        .slice(0, ANALOGS_LIMIT),
    };
  }

  /** Замена упражнения: «только сегодня» или ещё и «в комплексе». План подходов не меняется. */
  public async replace(
    userId: number,
    itemId: number,
    newExerciseId: number,
    inComplex: boolean,
  ): Promise<number> {
    const item = await this.findItem(userId, itemId);
    if (item.workout.status !== 'IN_PROGRESS')
      throw new BadRequestException('Тренировка уже закрыта.');
    const visible = await this.prisma.exercise.findFirst({
      where: {
        id: newExerciseId,
        OR: [{ status: 'CATALOG' }, { status: 'DRAFT', authorId: userId }],
      },
      select: { id: true },
    });
    if (!visible) throw new NotFoundException('Упражнение не найдено.');
    // Упражнение, стоявшее в комплексе изначально: повторная замена не теряет его
    const originalId = item.replacedExerciseId ?? item.exerciseId;
    await this.prisma.$transaction([
      // История весов у аналога своя — подходы старого упражнения к нему не относятся
      this.prisma.workoutSet.deleteMany({
        where: { workoutExerciseId: itemId },
      }),
      this.prisma.workoutExercise.update({
        where: { id: itemId },
        data: {
          exerciseId: newExerciseId,
          replacedExerciseId: originalId,
          done: false,
        },
      }),
    ]);
    if (inComplex && item.workout.complexId)
      await this.programs.replaceExercise(
        userId,
        item.workout.complexId,
        originalId,
        newExerciseId,
        item.superset,
      );
    this.logger.log(
      `Замена упражнения: workoutExerciseId=${itemId}, ${item.exerciseId} → ${newExerciseId}, в комплексе=${inComplex}`,
    );
    return item.workoutId;
  }

  // ── Добавление ──────────────────────────────────────────────────────────

  /**
   * Ещё упражнения в идущую тренировку — силы остались. Встают в конец со стандартным планом подходов;
   * с inComplex — ещё и в конец комплекса, чтобы были и в следующий раз. Дубли разрешены, как в комплексе.
   * В прошедшую — забытое упражнение из статистики: только в эту тренировку, комплекс не трогаем.
   */
  public async addItems(
    userId: number,
    workoutId: number,
    exerciseIds: number[],
    inComplex: boolean,
  ): Promise<void> {
    const workout = await this.prisma.workout.findFirst({
      where: { id: workoutId, userId },
      select: {
        status: true,
        complexId: true,
        exercises: {
          orderBy: { position: 'desc' },
          take: 1,
          select: { position: true },
        },
      },
    });
    if (!workout) throw new NotFoundException('Тренировка не найдена.');
    if (inComplex && workout.status !== 'IN_PROGRESS')
      throw new BadRequestException(
        'В комплекс добавляют только из идущей тренировки.',
      );
    const fresh = [...new Set(exerciseIds)];
    const visible = await this.prisma.exercise.findMany({
      where: {
        id: { in: fresh },
        OR: [{ status: 'CATALOG' }, { status: 'DRAFT', authorId: userId }],
      },
      select: { id: true, measure: true },
    });
    if (visible.length !== fresh.length)
      throw new NotFoundException('Упражнение не найдено.');
    const measureOf = new Map(visible.map((e) => [e.id, e.measure]));
    const last = workout.exercises[0]?.position ?? 0;
    await this.prisma.workoutExercise.createMany({
      data: exerciseIds.map((exerciseId, index) => {
        const plan = defaultPlan(measureOf.get(exerciseId)!);
        return {
          workoutId,
          exerciseId,
          position: last + index + 1,
          plannedSets: plan.sets,
          repsMin: plan.repsMin,
          repsMax: plan.repsMax,
        };
      }),
    });
    if (inComplex && workout.complexId)
      await this.programs.addExercises(userId, workout.complexId, exerciseIds);
    this.logger.log(
      `Упражнения добавлены в тренировку: workoutId=${workoutId}, exerciseIds=${exerciseIds.join(',')}, в комплексе=${inComplex && workout.complexId !== null}`,
    );
  }

  /**
   * Убрать упражнение вместе с подходами — лишнее или ошибочно добавленное в прошедшую тренировку.
   * Последнее не убираем: пустая тренировка — это удаление тренировки целиком.
   */
  public async removeItem(userId: number, itemId: number): Promise<number> {
    const item = await this.findItem(userId, itemId);
    const count = await this.prisma.workoutExercise.count({
      where: { workoutId: item.workoutId },
    });
    if (count <= 1)
      throw new BadRequestException(
        'Это последнее упражнение — удали тренировку целиком.',
      );
    await this.prisma.workoutExercise.delete({ where: { id: itemId } });
    this.logger.log(
      `Упражнение убрано из тренировки: workoutExerciseId=${itemId}, workoutId=${item.workoutId}, подходов=${item.sets.length}`,
    );
    return item.workoutId;
  }

  // ── Разминка ────────────────────────────────────────────────────────────

  /** Разминка закончена или пропущена: только у тренировки с разминкой и один раз. */
  public async warmupFinish(
    userId: number,
    workoutId: number,
    at?: Date,
  ): Promise<void> {
    const { count } = await this.prisma.workout.updateMany({
      where: {
        id: workoutId,
        userId,
        warmupMinutes: { not: null },
        warmupFinishedAt: null,
      },
      data: { warmupFinishedAt: this.clientAt(at) },
    });
    if (count)
      this.logger.log(
        `Разминка закончена: workoutId=${workoutId}, userId=${userId}`,
      );
    else
      this.logger.debug(
        `Разминка уже закончена, её нет или нет тренировки: workoutId=${workoutId}, userId=${userId}`,
      );
  }

  // ── Заминка ─────────────────────────────────────────────────────────────

  public async cooldown(
    userId: number,
    workoutId: number,
  ): Promise<CooldownView> {
    const workout = await this.find(userId, workoutId);
    const onlyDone =
      workout.mode === 'DETAILED' && workout.status !== 'IN_PROGRESS';
    return this.cooldowns.build(workoutId, userId, onlyDone);
  }

  /** Растяжку больше не предлагать: в этой заминке — замена, дальше — не попадёт. */
  public async cooldownExclude(
    userId: number,
    workoutId: number,
    stretchId: number,
  ): Promise<CooldownView> {
    await this.cooldowns.exclude(workoutId, userId, stretchId);
    return this.cooldown(userId, workoutId);
  }

  /** Заминка открыта: пишется только первое открытие, повтор ничего не меняет. */
  public async cooldownStart(
    userId: number,
    workoutId: number,
    at?: Date,
  ): Promise<void> {
    const { count } = await this.prisma.workout.updateMany({
      where: { id: workoutId, userId, cooldownStartedAt: null },
      data: { cooldownStartedAt: this.clientAt(at) },
    });
    if (count)
      this.logger.log(
        `Заминка начата: workoutId=${workoutId}, userId=${userId}`,
      );
    else
      this.logger.debug(
        `Заминка уже начата или тренировки нет: workoutId=${workoutId}, userId=${userId}`,
      );
  }

  /** Заминка пройдена: только после начала и один раз. */
  public async cooldownFinish(
    userId: number,
    workoutId: number,
    at?: Date,
  ): Promise<void> {
    const { count } = await this.prisma.workout.updateMany({
      where: {
        id: workoutId,
        userId,
        cooldownStartedAt: { not: null },
        cooldownFinishedAt: null,
      },
      data: { cooldownFinishedAt: this.clientAt(at) },
    });
    if (count)
      this.logger.log(
        `Заминка пройдена: workoutId=${workoutId}, userId=${userId}`,
      );
    else
      this.logger.debug(
        `Заминка уже пройдена, не начата или тренировки нет: workoutId=${workoutId}, userId=${userId}`,
      );
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /** Время нажатия с клиента (разминка, заминка); из будущего не берём. */
  private clientAt(at?: Date): Date {
    const now = Date.now();
    return new Date(at ? Math.min(now, +at) : now);
  }

  /** Подход пользователя. Статус не проверяем: прошедшие тренировки правятся из статистики. */
  private async ownedSet(userId: number, setId: number) {
    const set = await this.prisma.workoutSet.findFirst({
      where: { id: setId, workoutExercise: { workout: { userId } } },
      include: {
        workoutExercise: {
          include: { workout: true, exercise: { select: { measure: true } } },
        },
      },
    });
    if (!set) throw new NotFoundException('Подход не найден.');
    return set;
  }

  /** Новый подход в конец упражнения. */
  private async createSet(
    item: Awaited<ReturnType<WorkoutService['findItem']>>,
    weight: number,
    reps: number,
    clientId?: string,
    timing: SetTiming = {},
  ): Promise<number> {
    const closed = item.workout.status !== 'IN_PROGRESS';
    // Повтор из офлайн-очереди: первый запрос дошёл, ответ потерялся
    if (clientId && item.sets.some((s) => s.clientId === clientId)) {
      this.logger.debug(
        `Повтор подхода: clientId=${clientId}, workoutExerciseId=${item.id}, userId=${item.workout.userId}`,
      );
      return item.workoutId;
    }
    try {
      await this.prisma.$transaction([
        this.prisma.workoutSet.create({
          data: {
            workoutExerciseId: item.id,
            number: (item.sets.at(-1)?.number ?? 0) + 1,
            weight,
            reps,
            clientId,
            ...this.setTiming(item, timing, closed),
          },
        }),
        // В прошедшей тренировке «сделано» уже не нажать, а нагрузка по мышцам считает только сделанные
        ...(closed && !item.done
          ? [
              this.prisma.workoutExercise.update({
                where: { id: item.id },
                data: { done: true },
              }),
            ]
          : []),
      ]);
    } catch (error) {
      // Тот же подход пришёл дважды одновременно (ретрай по таймауту, пока первый ещё пишется)
      if (
        clientId &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        JSON.stringify(error.meta ?? {}).includes('clientId')
      ) {
        this.logger.warn(
          `Параллельный повтор подхода: clientId=${clientId}, workoutExerciseId=${item.id}, userId=${item.workout.userId}`,
        );
        return item.workoutId;
      }
      throw error;
    }
    if (closed)
      this.logger.log(
        `Подход добавлен в прошедшую тренировку: workoutId=${item.workoutId}, workoutExerciseId=${item.id}, userId=${item.workout.userId}`,
      );
    else
      this.logger.debug(
        `Подход записан: workoutExerciseId=${item.id}, userId=${item.workout.userId}`,
      );
    return item.workoutId;
  }

  /**
   * Время подхода для записи. В закрытую тренировку (правка из статистики) время не пишем —
   * подход не был сделан «сейчас». Время с клиента не раньше старта и не из будущего.
   */
  private setTiming(
    item: Awaited<ReturnType<WorkoutService['findItem']>>,
    timing: SetTiming,
    closed: boolean,
  ): Pick<
    Prisma.WorkoutSetUncheckedCreateInput,
    'doneAt' | 'workSeconds' | 'restTargetSeconds'
  > {
    const { userId, id: workoutId, startedAt } = item.workout;
    if (closed) {
      if (timing.doneAt)
        this.logger.debug(
          `Время подхода отброшено, тренировка закрыта: workoutId=${workoutId}, userId=${userId}`,
        );
      return { doneAt: null, workSeconds: null, restTargetSeconds: null };
    }
    const now = Date.now();
    let doneAt = timing.doneAt ?? new Date(now);
    const clamped = Math.min(now, Math.max(startedAt.getTime(), +doneAt));
    if (clamped !== +doneAt) {
      this.logger.warn(
        `Время подхода срезано: workoutId=${workoutId}, userId=${userId}, пришло=${doneAt.toISOString()}, стало=${new Date(clamped).toISOString()}`,
      );
      doneAt = new Date(clamped);
    }
    this.logger.debug(
      `Время подхода: workoutId=${workoutId}, userId=${userId}, doneAt=${doneAt.toISOString()}, работа=${timing.workSeconds ?? '—'}с, план отдыха=${timing.restTargetSeconds ?? '—'}с`,
    );
    return {
      doneAt,
      workSeconds: timing.workSeconds ?? null,
      restTargetSeconds: timing.restTargetSeconds ?? null,
    };
  }

  private async create(
    profile: SportProfile,
    complexId: number,
    date: Date,
    mode: TrackingMode,
  ): Promise<WorkoutFull> {
    const userId = profile.userId;
    const complex = await this.programs.findComplex(userId, complexId);
    // Детальную без упражнений вести нечем; простая (вечернее «да») просто отмечает день
    if (mode === 'DETAILED' && !complex.exercises.length) {
      this.logger.warn(
        `Старт пустого комплекса отклонён: userId=${userId}, complexId=${complexId}`,
      );
      throw new BadRequestException(
        'В тренировке нет упражнений — добавь их в программе.',
      );
    }
    const workout = await this.prisma.workout.create({
      data: {
        userId,
        complexId: complex.id,
        complexName: complex.name,
        cardioName: complex.cardioName,
        cardioMinutes: complex.cardioMinutes,
        // Экран разминки есть только в Mini App — в простом режиме бота её нет
        warmupMinutes:
          mode === 'DETAILED' ? resolveWarmup(complex, profile) : null,
        date,
        mode,
        exercises: {
          create: complex.exercises.map((item) => ({
            exerciseId: item.exerciseId,
            position: item.position,
            plannedSets: item.sets,
            repsMin: item.repsMin,
            repsMax: item.repsMax,
            superset: item.superset,
          })),
        },
      },
      include: WORKOUT_INCLUDE,
    });
    // Выбранный вручную комплекс засчитывается и при вечернем «да»
    await this.prisma.planDay.updateMany({
      where: { userId, date, status: 'PENDING' },
      data: { suggestedComplexId: complex.id },
    });
    this.logger.log(
      `Тренировка создана: workoutId=${workout.id}, userId=${userId}, complexId=${complexId}, режим=${mode}`,
    );
    return workout;
  }
}
