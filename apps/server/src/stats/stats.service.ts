import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'prisma/prisma.service';

import {
  addDays,
  btn,
  fmtRange,
  localToday,
  monthStart,
  msg,
  plural,
  weekStart,
} from '@/bot';
import { normalizeName, uploadRoot } from '@/catalog/catalog.service';
import { paginatePrisma } from '@/common/prisma';
import {
  ExerciseMeasure,
  Prisma,
  SportProfile,
} from '@/generated/prisma/client';
import { MessengerMessage, strike } from '@/messengers';
import { exerciseRests } from '@/workout/workout-timing';

import { renderProgressChart } from './progress-chart';

export interface Attendance {
  done: number;
  planned: number;
  percent: number;
}

export interface MuscleLoad {
  name: string;
  sets: number;
}

const FORGOTTEN_DAYS = 14;
const CHART_POINTS = 30;
const SPARK_POINTS = 12;
/** «Стоит»: за столько дней ≥2 тренировки с упражнением, и ни одна не побила прежний лучший подход. */
const STALL_DAYS = 21;
const DONE_STATUSES = ['FINISHED', 'AUTO_CLOSED'] as const;

const num = (value: number): string => String(Number(value.toFixed(1)));
const round1 = (value: number): number => Math.round(value * 10) / 10;

/** В чём считается прогресс упражнения: вес или, если веса нет, повторы; на время — секунды. */
export type ProgressUnit = 'kg' | 'reps' | 'sec' | 'min';

export type ProgressStatus = 'growing' | 'flat' | 'stalled' | 'idle';

/** Лучший подход тренировки. value — что рисуем на графике: кг, повторы, секунды или минуты. */
export interface BestSet {
  weight: number;
  reps: number;
  value: number;
}

export interface ProgressPoint extends BestSet {
  date: Date;
}

export interface Progress {
  unit: ProgressUnit;
  points: ProgressPoint[];
}

/** Прогресс упражнения за период: для списка и шапки страницы упражнения. */
export interface ExerciseProgress {
  id: number;
  name: string;
  unit: ProgressUnit;
  /** Лучший подход за всё время */
  best: BestSet;
  /** Рост за период: лучшая точка периода против первой; 0 — не выросло или точка одна */
  delta: number;
  /** В чём рост: у упражнения с весом — повторы, если вес не менялся */
  deltaUnit: ProgressUnit;
  sessions: number;
  lastDate: Date;
  status: ProgressStatus;
  spark: number[];
}

/** Расчётный 1ПМ и подход, по которому он посчитан. */
export interface E1rm {
  value: number;
  weight: number;
  reps: number;
}

export interface RecordEntry {
  date: Date;
  exerciseId: number;
  name: string;
  unit: ProgressUnit;
  set: BestSet;
  previous: BestSet;
}

interface ProgressRow {
  workout: { date: Date };
  sets: SetRow[];
}

/** Строка истории упражнения: подходы со временем — для отдыха между ними. */
interface SessionRow extends ProgressRow {
  id: number;
  sets: (SetRow & { doneAt: Date | null; workSeconds: number | null })[];
}

interface HistoryRow extends ProgressRow {
  id: number;
  exerciseId: number;
  exercise: { name: string; measure: ExerciseMeasure };
}

const UNIT_SHORT: Record<ProgressUnit, string> = {
  kg: 'кг',
  reps: 'повт.',
  sec: 'с',
  min: 'мин',
};
const UNIT_AXIS: Record<ProgressUnit, string> = {
  kg: 'вес лучшего подхода, кг',
  reps: 'максимум повторов в подходе',
  sec: 'лучшее время подхода, с',
  min: 'лучшее время подхода, мин',
};

/** Статистика: агрегирующие запросы без таблиц-кэшей — объёмы малы (раздел 27 ТЗ). */
@Injectable()
export class StatsService {
  private readonly logger = new Logger(`📊 ${StatsService.name}`);

  constructor(private readonly prisma: PrismaService) {}

  // ── Посещаемость ────────────────────────────────────────────────────────

  /**
   * Выполненные / запланированные за период [from, to]. В знаменателе — DONE, MISSED и PENDING
   * с датой до сегодня; PAUSED и разовые перенесённые дни не входят. Не больше 100%.
   */
  public async attendance(
    userId: number,
    from: Date,
    to: Date,
    today: Date,
  ): Promise<Attendance> {
    const days = await this.prisma.planDay.findMany({
      where: { userId, type: 'PLANNED', date: { gte: from, lte: to } },
      select: { status: true, date: true },
    });
    const done = days.filter((d) => d.status === 'DONE').length;
    const planned =
      done +
      days.filter(
        (d) =>
          d.status === 'MISSED' || (d.status === 'PENDING' && d.date < today),
      ).length;
    return {
      done,
      planned,
      percent: planned ? Math.min(100, Math.round((done / planned) * 100)) : 0,
    };
  }

  // ── Нагрузка ────────────────────────────────────────────────────────────

  /**
   * Подходы на группу мышц за период: основная мышца — 1 за подход, вспомогательная — 0,5.
   * Детальный режим — фактические подходы, простой — плановые.
   */
  public async muscleLoad(
    userId: number,
    from: Date,
    to: Date,
  ): Promise<Map<number, number>> {
    const items = await this.prisma.workoutExercise.findMany({
      where: {
        done: true,
        workout: {
          userId,
          status: { in: [...DONE_STATUSES] },
          date: { gte: from, lte: to },
        },
      },
      select: {
        plannedSets: true,
        workout: { select: { mode: true } },
        _count: { select: { sets: true } },
        exercise: {
          select: { muscles: { select: { muscleId: true, role: true } } },
        },
      },
    });
    const load = new Map<number, number>();
    for (const item of items) {
      const sets =
        item.workout.mode === 'DETAILED' ? item._count.sets : item.plannedSets;
      for (const muscle of item.exercise.muscles)
        load.set(
          muscle.muscleId,
          (load.get(muscle.muscleId) ?? 0) +
            sets * (muscle.role === 'PRIMARY' ? 1 : 0.5),
        );
    }
    return load;
  }

  // ── Сводка ──────────────────────────────────────────────────────────────

  /** Текст сводки за неделю, в которую попадает today: общий для /stats, воскресной сводки и друга. */
  public async summaryLines(
    profile: SportProfile,
    options: { withMonth?: boolean } = {},
  ): Promise<string[]> {
    const userId = profile.userId;
    const today = localToday(profile.timeZone);
    const monday = weekStart(today);
    const sunday = addDays(monday, 6);
    const muscles = await this.prisma.muscle.findMany({
      orderBy: { bodyOrder: 'asc' },
    });
    const [week, weekLoad, recentLoad, fresh] = await Promise.all([
      this.attendance(userId, monday, sunday, today),
      this.muscleLoad(userId, monday, sunday),
      this.muscleLoad(userId, addDays(today, -(FORGOTTEN_DAYS - 1)), today),
      this.prisma.sportProfile.findUniqueOrThrow({
        where: { userId },
        select: { currentStreak: true, bestStreak: true },
      }),
    ]);

    const lines = [
      `🗓 Неделя ${fmtRange(monday, sunday)}`,
      `🏋️ Тренировок: ${week.done} из ${week.planned}${week.planned ? ` (${week.percent}%)` : ''}`,
    ];
    if (options.withMonth) {
      const month = await this.attendance(
        userId,
        monthStart(today),
        today,
        today,
      );
      lines.push(
        `📅 За месяц: ${month.done} из ${month.planned}${month.planned ? ` (${month.percent}%)` : ''}`,
      );
    }
    lines.push(
      `🔥 Серия: ${fresh.currentStreak}, 🏆 рекорд: ${fresh.bestStreak}`,
      '',
    );

    const loaded = muscles
      .filter((m) => (weekLoad.get(m.id) ?? 0) > 0)
      .sort((a, b) => (weekLoad.get(b.id) ?? 0) - (weekLoad.get(a.id) ?? 0));
    lines.push(
      '💪 Подходы по мышцам:',
      loaded.length
        ? loaded
            .map(
              (m) =>
                `${m.name.toLowerCase()} — ${num(weekLoad.get(m.id) ?? 0)}`,
            )
            .join(', ')
        : 'за эту неделю подходов нет',
    );
    const forgotten = muscles.filter((m) => !(recentLoad.get(m.id) ?? 0));
    // Пока тренировок не было совсем, «забыто всё» — шум, а не подсказка
    if (forgotten.length && forgotten.length < muscles.length)
      lines.push(
        `😴 Забыто: ${forgotten.map((m) => strike(m.name.toLowerCase())).join(', ')}`,
      );
    return lines;
  }

  public async weeklySummary(profile: SportProfile): Promise<MessengerMessage> {
    return msg((await this.summaryLines(profile)).join('\n'), [
      [btn('📈 Прогресс', 'ss:prog')],
    ]);
  }

  // ── Прогресс весов ──────────────────────────────────────────────────────

  /** Точки прогресса упражнения: в кг или, у упражнений без веса, в повторах. До 30 последних. */
  public async progressPoints(
    userId: number,
    exerciseId: number,
  ): Promise<Progress> {
    const items = await this.prisma.workoutExercise.findMany({
      where: {
        exerciseId,
        sets: { some: {} },
        workout: { userId, status: { in: [...DONE_STATUSES] } },
      },
      orderBy: [{ workout: { date: 'desc' } }, { id: 'desc' }],
      take: CHART_POINTS,
      select: {
        workout: { select: { date: true } },
        exercise: { select: { measure: true } },
        sets: { select: { weight: true, reps: true } },
      },
    });
    return progressOf(items.reverse(), items[0]?.exercise.measure ?? 'REPS');
  }

  /**
   * Прогресс по упражнениям за период: лучший подход, рост, статус «стоит» / «не делали».
   * muscleId — только упражнения, где мышца основная: иначе у трицепса окажется весь жим.
   */
  public async progressList(
    userId: number,
    options: {
      from: Date;
      today: Date;
      muscleId?: number;
      status?: 'growing' | 'stalled';
      search?: string;
      limit?: number;
    },
  ): Promise<ExerciseProgress[]> {
    const { from, today, muscleId, status, search, limit } = options;
    const rows = await this.historyRows(userId, {
      exercise: {
        ...(muscleId && {
          muscles: { some: { muscleId, role: 'PRIMARY' } },
        }),
        ...(search && {
          nameNormalized: { contains: normalizeName(search) },
        }),
      },
    });
    const list = [...groupByExercise(rows).values()]
      .map((group) => summarize(group, from, today))
      .filter((e): e is ExerciseProgress => !!e)
      .filter((e) => !status || e.status === status)
      // Основа программы — сверху, давно заброшенные — в конце
      .sort(
        (a, b) =>
          Number(a.status === 'idle') - Number(b.status === 'idle') ||
          b.sessions - a.sessions ||
          a.name.localeCompare(b.name, 'ru'),
      );
    this.logger.debug(
      `Прогресс упражнений: userId=${userId}, muscleId=${muscleId ?? '-'}, status=${status ?? '-'}, найдено=${list.length}`,
    );
    return limit ? list.slice(0, limit) : list;
  }

  /** Прогресс одного упражнения: шапка, точки периода и, по запросу, расчётный 1ПМ. */
  public async exerciseProgress(
    userId: number,
    exerciseId: number,
    options: { from: Date; today: Date; addE1rm?: boolean },
  ): Promise<{
    name: string;
    summary: ExerciseProgress | null;
    unit: ProgressUnit;
    points: ProgressPoint[];
    e1rm?: {
      current: E1rm | null;
      best: E1rm | null;
      points: { date: Date; value: number }[];
    };
  }> {
    const { from, today, addE1rm } = options;
    const [exercise, rows] = await Promise.all([
      this.prisma.exercise.findUnique({
        where: { id: exerciseId },
        select: { name: true, measure: true },
      }),
      this.historyRows(userId, { exerciseId }),
    ]);
    if (!exercise) throw new NotFoundException('Упражнение не найдено.');
    const { unit, points } = progressOf(rows, exercise.measure);
    const result = {
      name: exercise.name,
      summary: rows.length ? summarize(rows, from, today) : null,
      unit,
      points: points.filter((p) => p.date >= from),
    };
    // 1ПМ считается только по весу: у упражнений без веса и на время его нет
    if (!addE1rm || unit !== 'kg') return result;
    const e1rm = rows.flatMap((r) => {
      const estimate = e1rmOf(r.sets);
      return estimate ? [{ date: r.workout.date, ...estimate }] : [];
    });
    const period = e1rm.filter((p) => p.date >= from);
    const best = period.length
      ? period.reduce((top, p) => (p.value > top.value ? p : top))
      : null;
    return {
      ...result,
      e1rm: {
        current: e1rm.at(-1) ?? null,
        best,
        points: period.map(({ date, value }) => ({ date, value })),
      },
    };
  }

  /** История тренировок с упражнением, новые сверху: все подходы, какой из них лучший, был ли рекорд. */
  public async sessions(
    userId: number,
    exerciseId: number,
    page: number,
    limit: number,
  ) {
    const where = {
      exerciseId,
      sets: { some: {} },
      workout: { userId, status: { in: [...DONE_STATUSES] } },
    };
    const [rows, result] = await Promise.all([
      this.historyRows(userId, { exerciseId }),
      paginatePrisma(this.prisma.workoutExercise, {
        page,
        limit,
        where,
        orderBy: [{ workout: { date: 'desc' } }, { id: 'desc' }],
        include: {
          workout: { select: { date: true } },
          sets: {
            orderBy: { number: 'asc' },
            select: {
              weight: true,
              reps: true,
              doneAt: true,
              workSeconds: true,
            },
          },
        },
      }),
    ]);
    const unit = progressOf(rows, rows[0]?.exercise.measure ?? 'REPS').unit;
    const records = recordRows(rows, unit);
    return {
      meta: result.meta,
      items: (result.items as unknown as SessionRow[]).map((r) => {
        const rests = exerciseRests(r.sets);
        return {
          id: r.id,
          date: r.workout.date,
          sets: r.sets.map((s, index) => ({
            weight: Number(s.weight),
            reps: s.reps,
            restBeforeSeconds: rests[index],
          })),
          bestIndex: bestIndexOf(r.sets, unit),
          isRecord: records.has(r.id),
        };
      }),
    };
  }

  /**
   * Лента личных рекордов, новые сверху: та же логика, что у рекордов в итоге тренировки.
   * from — только рекорды с этой даты; сравниваются они всё равно со всей историей.
   */
  public async recordsFeed(
    userId: number,
    options: { from?: Date; limit?: number } = {},
  ): Promise<RecordEntry[]> {
    const { from, limit } = options;
    const rows = await this.historyRows(userId);
    const feed: RecordEntry[] = [];
    for (const [exerciseId, group] of groupByExercise(rows)) {
      const { unit, points } = progressOf(group, group[0].exercise.measure);
      let top: ProgressPoint | null = null;
      for (const point of points) {
        if (top && betterSet(point, top) && (!from || point.date >= from))
          feed.push({
            date: point.date,
            exerciseId,
            name: group[0].exercise.name,
            unit,
            set: point,
            previous: top,
          });
        if (!top || betterSet(point, top)) top = point;
      }
    }
    feed.sort((a, b) => b.date.getTime() - a.date.getTime());
    this.logger.debug(
      `Лента рекордов: userId=${userId}, рекордов=${feed.length}`,
    );
    return limit ? feed.slice(0, limit) : feed;
  }

  /**
   * Упражнения, по которым есть хотя бы две точки прогресса, и в чём он считается.
   * Точки в кг — только тренировки с весом, в повторах — любые тренировки с подходами.
   */
  public async progressExercises(
    userId: number,
  ): Promise<{ id: number; name: string; unit: ProgressUnit }[]> {
    const where = {
      sets: { some: {} },
      workout: { userId, status: { in: [...DONE_STATUSES] } },
    };
    const [all, weighted] = await Promise.all([
      this.prisma.workoutExercise.groupBy({
        by: ['exerciseId'],
        where,
        _count: { _all: true },
      }),
      this.prisma.workoutExercise.groupBy({
        by: ['exerciseId'],
        where: { ...where, sets: { some: { weight: { gt: 0 } } } },
        _count: { _all: true },
      }),
    ]);
    const withWeight = new Map(
      weighted.map((g) => [g.exerciseId, g._count._all]),
    );
    const units = new Map<number, ProgressUnit>();
    for (const g of all) {
      const kg = withWeight.get(g.exerciseId);
      if ((kg ?? g._count._all) >= 2)
        units.set(g.exerciseId, kg ? 'kg' : 'reps');
    }
    if (!units.size) return [];
    const exercises = await this.prisma.exercise.findMany({
      where: { id: { in: [...units.keys()] } },
      select: { id: true, name: true, measure: true },
      orderBy: { name: 'asc' },
    });
    // У упражнений на время прогресс всегда в секундах, даже если когда-то записали вес
    return exercises.map(({ measure, ...e }) => ({
      ...e,
      unit: timedUnit(measure) ?? units.get(e.id)!,
    }));
  }

  /**
   * График прогресса PNG во временный файл. @returns путь и подпись; null — точек меньше двух.
   * Файл удаляет вызывающий после отправки.
   */
  public async progressChart(
    userId: number,
    exerciseId: number,
  ): Promise<{ file: string; caption: string } | null> {
    const { unit, points } = await this.progressPoints(userId, exerciseId);
    if (points.length < 2) return null;
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { name: true },
    });
    const name = exercise?.name ?? 'Упражнение';
    const png = renderProgressChart(name, points, UNIT_AXIS[unit]);
    const dir = path.join(uploadRoot(), 'tmp');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(
      dir,
      `progress-${userId}-${exerciseId}-${Date.now()}.png`,
    );
    fs.writeFileSync(file, png);
    this.logger.debug(
      `График построен: userId=${userId}, exerciseId=${exerciseId}, unit=${unit}`,
    );
    const first = points[0];
    const last = points.at(-1)!;
    return {
      file,
      caption: `📈 ${name}: ${setText(first, unit)} → ${setText(last, unit)} за ${points.length} ${plural(points.length, 'тренировку', 'тренировки', 'тренировок')}`,
    };
  }

  // ── Рекорды ─────────────────────────────────────────────────────────────

  /**
   * Личные рекорды тренировки: лучший подход лучше, чем во всех более ранних тренировках —
   * больше вес или столько же, но больше повторов. Первый раз — не рекорд, иначе первая
   * тренировка целиком из «рекордов».
   */
  public async records(
    userId: number,
    workout: {
      id: number;
      startedAt: Date;
      exercises: {
        exerciseId: number;
        exercise: { name: string; measure: ExerciseMeasure };
        sets: { weight: unknown; reps: number }[];
      }[];
    },
  ): Promise<PersonalRecord[]> {
    const today = new Map<
      number,
      { name: string; measure: ExerciseMeasure; sets: SetRow[] }
    >();
    for (const item of workout.exercises) {
      if (!item.sets.length) continue;
      const entry = today.get(item.exerciseId) ?? {
        name: item.exercise.name,
        measure: item.exercise.measure,
        sets: [],
      };
      entry.sets.push(...item.sets);
      today.set(item.exerciseId, entry);
    }
    if (!today.size) return [];

    const history = await this.prisma.workoutExercise.findMany({
      where: {
        exerciseId: { in: [...today.keys()] },
        sets: { some: {} },
        workout: {
          userId,
          id: { not: workout.id },
          status: { in: [...DONE_STATUSES] },
          startedAt: { lt: workout.startedAt },
        },
      },
      select: {
        exerciseId: true,
        sets: { select: { weight: true, reps: true } },
      },
    });

    const records: PersonalRecord[] = [];
    for (const [exerciseId, { name, measure, sets }] of today) {
      const before = history
        .filter((h) => h.exerciseId === exerciseId)
        .flatMap((h) => h.sets);
      if (!before.length) continue;
      const unit = unitOf([...before, ...sets], measure);
      const best = bestSetOf(sets, unit);
      const previous = bestSetOf(before, unit);
      // Подходов с весом раньше не было — сравнивать не с чем
      if (!previous || !best || !betterSet(best, previous)) continue;
      records.push({
        exerciseId,
        name,
        unit,
        value: best.value,
        reps: best.reps,
        previous: previous.value,
        previousReps: previous.reps,
      });
    }
    this.logger.debug(
      `Рекорды тренировки: userId=${userId}, workoutId=${workout.id}, рекордов=${records.length}`,
    );
    return records;
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /** Все тренировки пользователя с подходами по упражнениям, от старых к новым. */
  private historyRows(
    userId: number,
    where: Prisma.WorkoutExerciseWhereInput = {},
  ): Promise<HistoryRow[]> {
    return this.prisma.workoutExercise.findMany({
      where: {
        ...where,
        sets: { some: {} },
        workout: { userId, status: { in: [...DONE_STATUSES] } },
      },
      orderBy: [{ workout: { date: 'asc' } }, { id: 'asc' }],
      select: {
        id: true,
        exerciseId: true,
        exercise: { select: { name: true, measure: true } },
        workout: { select: { date: true } },
        sets: {
          orderBy: { number: 'asc' },
          select: { weight: true, reps: true },
        },
      },
    });
  }
}

type SetRow = { weight: unknown; reps: number };

export interface PersonalRecord {
  exerciseId: number;
  name: string;
  unit: ProgressUnit;
  value: number;
  /** Повторы лучшего подхода: при том же весе рекорд — это больше повторов */
  reps: number;
  previous: number;
  previousReps: number;
}

/** Подход a лучше b: больше вес, при равном весе — больше повторов. Без веса сравниваются повторы. */
export function betterSet(a: BestSet, b: BestSet): boolean {
  return a.weight !== b.weight ? a.weight > b.weight : a.reps > b.reps;
}

/** Лучший подход: по весу (без нулевых) и повторам, без веса — по повторам или времени. null — сравнивать не с чем. */
function bestSetOf(sets: SetRow[], unit: ProgressUnit): BestSet | null {
  const index = bestIndexOf(sets, unit);
  if (index < 0) return null;
  const set = sets[index];
  return unit === 'kg'
    ? { weight: Number(set.weight), reps: set.reps, value: Number(set.weight) }
    : { weight: 0, reps: set.reps, value: fromSeconds(unit, set.reps) };
}

/** Номер лучшего подхода в тренировке; -1 — подходов с весом нет. */
function bestIndexOf(sets: SetRow[], unit: ProgressUnit): number {
  // Без веса вес не сравниваем: случайные «2,5 кг» в отжиманиях не должны перебить повторы
  const asSet = (s: SetRow): BestSet => ({
    weight: unit === 'kg' ? Number(s.weight) : 0,
    reps: s.reps,
    value: 0,
  });
  let best = -1;
  sets.forEach((s, i) => {
    if (unit === 'kg' && Number(s.weight) <= 0) return;
    if (best < 0 || betterSet(asSet(s), asSet(sets[best]))) best = i;
  });
  return best;
}

/** В чём прогресс упражнения: на время — секунды или минуты, был хоть один вес — кг, иначе повторы. */
function unitOf(sets: SetRow[], measure: ExerciseMeasure): ProgressUnit {
  return (
    timedUnit(measure) ??
    (sets.some((s) => Number(s.weight) > 0) ? 'kg' : 'reps')
  );
}

/** Подход текстом для бота: «60 кг × 10», без веса — «12 повт.». */
function setText(set: BestSet, unit: ProgressUnit): string {
  return unit === 'kg'
    ? `${num(set.weight)} кг × ${set.reps}`
    : `${num(set.value)} ${UNIT_SHORT[unit]}`;
}

/**
 * Расчётный 1ПМ тренировки по Эпли: вес × (1 + повт/30), лучший из подходов, и подход, по которому
 * он посчитан: на многоповторных подходах оценка грубее, клиент об этом предупреждает. null — подходов с весом нет.
 */
function e1rmOf(sets: SetRow[]): E1rm | null {
  let best: E1rm | null = null;
  for (const s of sets) {
    const weight = Number(s.weight);
    if (weight <= 0 || s.reps <= 0) continue;
    // Один повтор — это и есть максимум, формула дала бы лишние 3%
    const value = round1(s.reps === 1 ? weight : weight * (1 + s.reps / 30));
    if (!best || value > best.value) best = { value, weight, reps: s.reps };
  }
  return best;
}

/** Строки истории по упражнениям, порядок внутри — как пришёл (от старых к новым). */
function groupByExercise(rows: HistoryRow[]): Map<number, HistoryRow[]> {
  const groups = new Map<number, HistoryRow[]>();
  for (const row of rows)
    groups.set(row.exerciseId, [...(groups.get(row.exerciseId) ?? []), row]);
  return groups;
}

/** Лучшая точка ряда по betterSet. */
function topOf(points: ProgressPoint[]): ProgressPoint {
  return points.reduce((top, p) => (betterSet(p, top) ? p : top));
}

/**
 * Рост за период: лучшая точка против первой. У упражнения с весом, если вес не менялся,
 * рост — в повторах: иначе +2 повтора на том же весе выглядели бы как «0 кг».
 */
function deltaOf(
  points: ProgressPoint[],
  unit: ProgressUnit,
): { delta: number; deltaUnit: ProgressUnit } {
  if (points.length < 2) return { delta: 0, deltaUnit: unit };
  const first = points[0];
  const top = topOf(points);
  if (unit === 'kg' && top.weight === first.weight)
    return { delta: top.reps - first.reps, deltaUnit: 'reps' };
  return { delta: round1(top.value - first.value), deltaUnit: unit };
}

/** Строки тренировок, где лучший подход побил все более ранние. Первая тренировка — не рекорд. */
function recordRows(rows: HistoryRow[], unit: ProgressUnit): Set<number> {
  const result = new Set<number>();
  let top: BestSet | null = null;
  for (const row of rows) {
    const best = bestSetOf(row.sets, unit);
    if (!best) continue;
    if (top && betterSet(best, top)) result.add(row.id);
    if (!top || betterSet(best, top)) top = best;
  }
  return result;
}

/** Сводка упражнения за период [from, today]; null — точек нет (например, только подходы без веса). */
function summarize(
  rows: HistoryRow[],
  from: Date,
  today: Date,
): ExerciseProgress | null {
  const { unit, points } = progressOf(rows, rows[0].exercise.measure);
  if (!points.length) return null;
  const period = points.filter((p) => p.date >= from);
  const { delta, deltaUnit } = deltaOf(period, unit);
  const top = topOf(points);
  return {
    id: rows[0].exerciseId,
    name: rows[0].exercise.name,
    unit,
    best: { weight: top.weight, reps: top.reps, value: top.value },
    delta,
    deltaUnit,
    sessions: period.length,
    lastDate: points.at(-1)!.date,
    status: statusOf(points, period, delta, today),
    spark: period.slice(-SPARK_POINTS).map((p) => p.value),
  };
}

/**
 * «Не делали» — в периоде тренировок нет. «Стоит» — за STALL_DAYS ≥2 тренировки, и ни одна не побила
 * лучший подход до них: считаем по тренировкам, иначе редкое упражнение «стояло» бы всегда.
 */
function statusOf(
  points: ProgressPoint[],
  period: ProgressPoint[],
  delta: number,
  today: Date,
): ProgressStatus {
  if (!period.length) return 'idle';
  const since = addDays(today, -(STALL_DAYS - 1));
  const recent = points.filter((p) => p.date >= since);
  const before = points.filter((p) => p.date < since);
  if (recent.length >= 2 && before.length) {
    const top = topOf(before);
    if (!recent.some((p) => betterSet(p, top))) return 'stalled';
  }
  return delta > 0 ? 'growing' : 'flat';
}

/** Единица прогресса упражнения на время: удержание — секунды, кардио — минуты. null — не на время. */
function timedUnit(measure: ExerciseMeasure): ProgressUnit | null {
  return measure === 'MINUTES' ? 'min' : measure === 'TIME' ? 'sec' : null;
}

/** Секунды подхода в единице прогресса: у кардио минуты с одним знаком. */
function fromSeconds(unit: ProgressUnit | null, value: number): number {
  return unit === 'min' ? Math.round(value / 6) / 10 : value;
}

/**
 * Прогресс по тренировкам упражнения: точка — лучший подход тренировки. Был хоть один подход
 * с весом — тренировки без веса пропускаем: «0 кг» на графике читается как провал. Веса не было
 * никогда (отжимания на брусьях, подтягивания) — лучший подход по повторам.
 */
function progressOf(rows: ProgressRow[], measure: ExerciseMeasure): Progress {
  const unit = unitOf(
    rows.flatMap((r) => r.sets),
    measure,
  );
  return {
    unit,
    points: rows.flatMap((r) => {
      const best = bestSetOf(r.sets, unit);
      return best ? [{ date: r.workout.date, ...best }] : [];
    }),
  };
}
