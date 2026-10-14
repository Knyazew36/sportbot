import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { localToday } from '@/bot';
import {
  Prisma,
  SportProfile,
  TrackingMode,
  WorkoutStatus,
} from '@/generated/prisma/client';
import { LimitationService } from '@/limitation/limitation.service';
import { PlanDayService } from '@/plan/plan-day.service';
import { ProgramService } from '@/program/program.service';

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

/** Границы ввода подхода — как в боте: вес 0..999 кг (0 — без веса), повторы 1..999. */
const isValidSet = (weight: number, reps: number): boolean =>
  Number.isFinite(weight) &&
  weight >= 0 &&
  weight <= 999 &&
  Number.isInteger(reps) &&
  reps >= 1 &&
  reps <= 999;

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

  // ── Подходы ─────────────────────────────────────────────────────────────

  /**
   * Подход из ввода «вес повторы»: «22 10», «22.5 10», «22,5х10»; только повторы («12») —
   * упражнение без веса.
   */
  public async addSet(userId: number, itemId: number, input: string) {
    const match =
      /^\s*(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:(?:[xх×*]|\s)\s*(\d{1,3}))?\s*$/i.exec(
        input,
      );
    const first = match ? Number(match[1].replace(',', '.')) : NaN;
    const weight = match?.[2] ? first : 0;
    const reps = match?.[2] ? Number(match[2]) : first;
    if (!match || !isValidSet(weight, reps))
      throw new BadRequestException(
        'Не понял. Напиши вес и повторы, например:\n60 10\nДробный вес — через точку: 22.5 10\nБез веса — только повторы: 10',
      );
    const item = await this.findItem(userId, itemId);
    // В чате подход пишется только в идущую тренировку: прошедшие правятся в приложении
    if (item.workout.status !== 'IN_PROGRESS')
      throw new BadRequestException('Тренировка уже закрыта.');
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
  ): Promise<number> {
    if (!isValidSet(weight, reps))
      throw new BadRequestException('Вес до 999 кг, повторы от 1 до 999.');
    const item = await this.findItem(userId, itemId);
    if (item.workout.mode === 'SIMPLE')
      throw new BadRequestException(
        'В простом режиме подходы не записываются.',
      );
    return this.createSet(item, weight, reps);
  }

  /** Исправить сохранённый подход — в идущей или прошедшей тренировке (frontend-tz, 8.2). */
  public async updateSet(
    userId: number,
    setId: number,
    weight: number,
    reps: number,
  ): Promise<number> {
    if (!isValidSet(weight, reps))
      throw new BadRequestException('Вес до 999 кг, повторы от 1 до 999.');
    const set = await this.ownedSet(userId, setId);
    await this.prisma.workoutSet.update({
      where: { id: setId },
      data: { weight, reps },
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
    options: { auto?: boolean; forDayId?: number } = {},
  ): Promise<CompleteResult> {
    const userId = profile.userId;
    const status: WorkoutStatus = options.auto ? 'AUTO_CLOSED' : 'FINISHED';
    const result = await this.prisma.$transaction(
      async (tx) => {
        const { count } = await tx.workout.updateMany({
          where: { id: workoutId, userId, status: 'IN_PROGRESS' },
          data: { status, finishedAt: new Date() },
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
      );
    this.logger.log(
      `Замена упражнения: workoutExerciseId=${itemId}, ${item.exerciseId} → ${newExerciseId}, в комплексе=${inComplex}`,
    );
    return item.workoutId;
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

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /** Подход пользователя. Статус не проверяем: прошедшие тренировки правятся из статистики. */
  private async ownedSet(userId: number, setId: number) {
    const set = await this.prisma.workoutSet.findFirst({
      where: { id: setId, workoutExercise: { workout: { userId } } },
      include: { workoutExercise: { include: { workout: true } } },
    });
    if (!set) throw new NotFoundException('Подход не найден.');
    return set;
  }

  /** Новый подход в конец упражнения. */
  private async createSet(
    item: Awaited<ReturnType<WorkoutService['findItem']>>,
    weight: number,
    reps: number,
  ): Promise<number> {
    const closed = item.workout.status !== 'IN_PROGRESS';
    await this.prisma.$transaction([
      this.prisma.workoutSet.create({
        data: {
          workoutExerciseId: item.id,
          number: (item.sets.at(-1)?.number ?? 0) + 1,
          weight,
          reps,
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

  private async create(
    profile: SportProfile,
    complexId: number,
    date: Date,
    mode: TrackingMode,
  ): Promise<WorkoutFull> {
    const userId = profile.userId;
    const complex = await this.programs.findComplex(userId, complexId);
    const workout = await this.prisma.workout.create({
      data: {
        userId,
        complexId: complex.id,
        complexName: complex.name,
        cardioName: complex.cardioName,
        cardioMinutes: complex.cardioMinutes,
        date,
        mode,
        exercises: {
          create: complex.exercises.map((item) => ({
            exerciseId: item.exerciseId,
            position: item.position,
            plannedSets: item.sets,
            repsMin: item.repsMin,
            repsMax: item.repsMax,
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
