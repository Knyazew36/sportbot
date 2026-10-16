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
import { uploadRoot } from '@/catalog/catalog.service';
import { SportProfile } from '@/generated/prisma/client';
import { MessengerMessage, strike } from '@/messengers';

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
const DONE_STATUSES = ['FINISHED', 'AUTO_CLOSED'] as const;

const num = (value: number): string => String(Number(value.toFixed(1)));

/** В чём считается прогресс упражнения: вес или, если веса нет, повторы. */
export type ProgressUnit = 'kg' | 'reps';

export interface Progress {
  unit: ProgressUnit;
  points: { date: Date; value: number }[];
}

interface ProgressRow {
  workout: { date: Date };
  sets: { weight: unknown; reps: number }[];
}

const UNIT_SHORT: Record<ProgressUnit, string> = { kg: 'кг', reps: 'повт.' };
const UNIT_AXIS: Record<ProgressUnit, string> = {
  kg: 'максимальный вес подхода, кг',
  reps: 'максимум повторов в подходе',
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
        sets: { select: { weight: true, reps: true } },
      },
    });
    return progressOf(items.reverse());
  }

  /**
   * Прогресс по мышце: упражнения, где она основная, у каждого — свои точки (кг или повторы).
   * Вспомогательная роль не берётся — иначе у трицепса окажется весь жим. До 30 точек на упражнение.
   */
  public async muscleProgress(
    userId: number,
    muscleId: number,
  ): Promise<{
    name: string;
    exercises: ({ id: number; name: string } & Progress)[];
  }> {
    const [muscle, items] = await Promise.all([
      this.prisma.muscle.findUnique({
        where: { id: muscleId },
        select: { name: true },
      }),
      this.prisma.workoutExercise.findMany({
        where: {
          sets: { some: {} },
          workout: { userId, status: { in: [...DONE_STATUSES] } },
          exercise: { muscles: { some: { muscleId, role: 'PRIMARY' } } },
        },
        orderBy: [{ workout: { date: 'asc' } }, { id: 'asc' }],
        select: {
          exerciseId: true,
          exercise: { select: { name: true } },
          workout: { select: { date: true } },
          sets: { select: { weight: true, reps: true } },
        },
      }),
    ]);
    if (!muscle) throw new NotFoundException('Мышца не найдена.');
    const byExercise = new Map<
      number,
      { id: number; name: string; rows: ProgressRow[] }
    >();
    for (const item of items) {
      const entry = byExercise.get(item.exerciseId) ?? {
        id: item.exerciseId,
        name: item.exercise.name,
        rows: [],
      };
      entry.rows.push(item);
      byExercise.set(item.exerciseId, entry);
    }
    const exercises = [...byExercise.values()]
      .map(({ id, name, rows }) => {
        const progress = progressOf(rows);
        return {
          id,
          name,
          unit: progress.unit,
          points: progress.points.slice(-CHART_POINTS),
        };
      })
      .filter((e) => e.points.length > 0)
      .sort(
        (a, b) =>
          b.points.length - a.points.length ||
          a.name.localeCompare(b.name, 'ru'),
      );
    this.logger.debug(
      `Прогресс по мышце: userId=${userId}, muscleId=${muscleId}, упражнений=${exercises.length}`,
    );
    return { name: muscle.name, exercises };
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
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return exercises.map((e) => ({ ...e, unit: units.get(e.id)! }));
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
    const first = points[0].value;
    const last = points.at(-1)!.value;
    const delta = last - first;
    return {
      file,
      caption: `📈 ${name}: ${num(first)} → ${num(last)} ${UNIT_SHORT[unit]} (${delta >= 0 ? '+' : '−'}${num(Math.abs(delta))}) за ${points.length} ${plural(points.length, 'тренировку', 'тренировки', 'тренировок')}`,
    };
  }

  // ── Рекорды ─────────────────────────────────────────────────────────────

  /**
   * Личные рекорды тренировки: лучший вес (или повторы — у упражнений без веса) выше, чем во всех
   * более ранних тренировках. Первый раз — не рекорд, иначе первая тренировка целиком из «рекордов».
   */
  public async records(
    userId: number,
    workout: {
      id: number;
      startedAt: Date;
      exercises: {
        exerciseId: number;
        exercise: { name: string };
        sets: { weight: unknown; reps: number }[];
      }[];
    },
  ): Promise<PersonalRecord[]> {
    const today = new Map<number, { name: string; sets: SetRow[] }>();
    for (const item of workout.exercises) {
      if (!item.sets.length) continue;
      const entry = today.get(item.exerciseId) ?? {
        name: item.exercise.name,
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
    for (const [exerciseId, { name, sets }] of today) {
      const before = history
        .filter((h) => h.exerciseId === exerciseId)
        .flatMap((h) => h.sets);
      if (!before.length) continue;
      const unit: ProgressUnit = [...before, ...sets].some(
        (s) => Number(s.weight) > 0,
      )
        ? 'kg'
        : 'reps';
      const value = bestOf(sets, unit);
      const previous = bestOf(before, unit);
      // Подходов с весом раньше не было — сравнивать не с чем
      if (previous === null || value === null || value <= previous) continue;
      records.push({ exerciseId, name, unit, value, previous });
    }
    this.logger.debug(
      `Рекорды тренировки: userId=${userId}, workoutId=${workout.id}, рекордов=${records.length}`,
    );
    return records;
  }
}

type SetRow = { weight: unknown; reps: number };

export interface PersonalRecord {
  exerciseId: number;
  name: string;
  unit: ProgressUnit;
  value: number;
  previous: number;
}

/** Лучший подход: максимальный вес (без нулевых) или максимум повторов. null — сравнивать не с чем. */
function bestOf(sets: SetRow[], unit: ProgressUnit): number | null {
  const values =
    unit === 'kg'
      ? sets.map((s) => Number(s.weight)).filter((w) => w > 0)
      : sets.map((s) => s.reps);
  return values.length ? Math.max(...values) : null;
}

/**
 * Прогресс по тренировкам упражнения. Был хоть один подход с весом — считаем лучший вес,
 * а тренировки без веса пропускаем: «0 кг» на графике читается как провал. Веса не было никогда
 * (отжимания на брусьях, подтягивания) — лучший подход по повторам.
 */
function progressOf(rows: ProgressRow[]): Progress {
  const weighted = rows.some((r) => r.sets.some((s) => Number(s.weight) > 0));
  if (!weighted)
    return {
      unit: 'reps',
      points: rows.map((r) => ({
        date: r.workout.date,
        value: Math.max(...r.sets.map((s) => s.reps)),
      })),
    };
  return {
    unit: 'kg',
    points: rows
      .map((r) => ({
        date: r.workout.date,
        value: Math.max(...r.sets.map((s) => Number(s.weight))),
      }))
      .filter((p) => p.value > 0),
  };
}
