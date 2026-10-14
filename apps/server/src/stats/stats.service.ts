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
      [btn('📈 Прогресс весов', 'ss:prog')],
    ]);
  }

  // ── Прогресс весов ──────────────────────────────────────────────────────

  /** Точки прогресса: тренировка → максимальный вес подхода. До 30 последних. */
  public async progressPoints(
    userId: number,
    exerciseId: number,
  ): Promise<{ date: Date; weight: number }[]> {
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
        sets: { select: { weight: true } },
      },
    });
    return items
      .map((item) => ({
        date: item.workout.date,
        weight: Math.max(...item.sets.map((s) => Number(s.weight))),
      }))
      .reverse();
  }

  /**
   * Прогресс по мышце: упражнения, где она основная, с точками «тренировка → лучший вес».
   * Вспомогательная роль не берётся — иначе у трицепса окажется весь жим. До 30 точек на упражнение.
   */
  public async muscleProgress(
    userId: number,
    muscleId: number,
  ): Promise<{
    name: string;
    exercises: {
      id: number;
      name: string;
      points: { date: Date; weight: number }[];
    }[];
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
          sets: { select: { weight: true } },
        },
      }),
    ]);
    if (!muscle) throw new NotFoundException('Мышца не найдена.');
    const byExercise = new Map<
      number,
      { id: number; name: string; points: { date: Date; weight: number }[] }
    >();
    for (const item of items) {
      const entry = byExercise.get(item.exerciseId) ?? {
        id: item.exerciseId,
        name: item.exercise.name,
        points: [],
      };
      entry.points.push({
        date: item.workout.date,
        weight: Math.max(...item.sets.map((s) => Number(s.weight))),
      });
      byExercise.set(item.exerciseId, entry);
    }
    const exercises = [...byExercise.values()]
      .map((e) => ({ ...e, points: e.points.slice(-CHART_POINTS) }))
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

  /** Упражнения, по которым есть хотя бы две точки прогресса. */
  public async progressExercises(
    userId: number,
  ): Promise<{ id: number; name: string }[]> {
    const groups = await this.prisma.workoutExercise.groupBy({
      by: ['exerciseId'],
      where: {
        sets: { some: {} },
        workout: { userId, status: { in: [...DONE_STATUSES] } },
      },
      _count: { _all: true },
    });
    const ids = groups
      .filter((g) => g._count._all >= 2)
      .map((g) => g.exerciseId);
    if (!ids.length) return [];
    return this.prisma.exercise.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * График прогресса PNG во временный файл. @returns путь и подпись; null — точек меньше двух.
   * Файл удаляет вызывающий после отправки.
   */
  public async progressChart(
    userId: number,
    exerciseId: number,
  ): Promise<{ file: string; caption: string } | null> {
    const points = await this.progressPoints(userId, exerciseId);
    if (points.length < 2) return null;
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { name: true },
    });
    const name = exercise?.name ?? 'Упражнение';
    const png = renderProgressChart(name, points);
    const dir = path.join(uploadRoot(), 'tmp');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(
      dir,
      `progress-${userId}-${exerciseId}-${Date.now()}.png`,
    );
    fs.writeFileSync(file, png);
    this.logger.debug(
      `График построен: userId=${userId}, exerciseId=${exerciseId}`,
    );
    const first = points[0].weight;
    const last = points.at(-1)!.weight;
    const delta = last - first;
    return {
      file,
      caption: `📈 ${name}: ${num(first)} → ${num(last)} кг (${delta >= 0 ? '+' : '−'}${num(Math.abs(delta))}) за ${points.length} тренировок`,
    };
  }
}
