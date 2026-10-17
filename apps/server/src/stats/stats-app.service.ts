import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { addDays, localToday, monthStart, weekStart } from '@/bot';
import { SportAccountService } from '@/bot/sport-account.service';
import { PlanDay, SportProfile } from '@/generated/prisma/client';
import { FIX_WINDOW_DAYS } from '@/plan/poll.service';
import { friendOf } from '@/social/social.service';

import {
  CalendarMark,
  StatsCalendarDayResponseDto,
} from './dto/stats-calendar-day.response.dto';
import { StatsAttendanceWeekResponseDto } from './dto/stats-attendance-week.response.dto';
import { StatsDayResponseDto } from './dto/stats-day.response.dto';
import { StatsExerciseResponseDto } from './dto/stats-exercise.response.dto';
import { StatsMuscleLoadResponseDto } from './dto/stats-muscle-load.response.dto';
import { StatsMuscleProgressResponseDto } from './dto/stats-muscle-progress.response.dto';
import { StatsPointResponseDto } from './dto/stats-point.response.dto';
import { StatsSummaryResponseDto } from './dto/stats-summary.response.dto';
import { StatsService } from './stats.service';

const FORGOTTEN_DAYS = 14;
const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
const parseDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

/**
 * Статистика в Mini App (frontend-tz, 12). Правила расчёта — StatsService, общий с ботом.
 * userId другого человека — только друга: его тренировки видны, вес тела — нет (business-tz, 15).
 */
@Injectable()
export class StatsAppService {
  private readonly logger = new Logger(`📊 ${StatsAppService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: SportAccountService,
    private readonly stats: StatsService,
  ) {}

  // ── Сводка и графики ────────────────────────────────────────────────────

  public async summary(
    viewerId: number,
    targetId?: number,
  ): Promise<StatsSummaryResponseDto> {
    const profile = await this.target(viewerId, targetId);
    const today = localToday(profile.timeZone);
    const monday = weekStart(today);
    const [week, month] = await Promise.all([
      this.stats.attendance(profile.userId, monday, addDays(monday, 6), today),
      this.stats.attendance(profile.userId, monthStart(today), today, today),
    ]);
    return {
      week,
      month,
      currentStreak: profile.currentStreak,
      bestStreak: profile.bestStreak,
    };
  }

  /** Посещаемость по неделям — от старых к новым. */
  public async attendanceWeekly(
    viewerId: number,
    targetId: number | undefined,
    weeks = 12,
  ): Promise<StatsAttendanceWeekResponseDto[]> {
    const profile = await this.target(viewerId, targetId);
    const today = localToday(profile.timeZone);
    const current = weekStart(today);
    return Promise.all(
      Array.from({ length: weeks }, async (_, i) => {
        const monday = addDays(current, -7 * (weeks - 1 - i));
        const result = await this.stats.attendance(
          profile.userId,
          monday,
          addDays(monday, 6),
          today,
        );
        return { weekStart: isoDate(monday), ...result };
      }),
    );
  }

  public async progressExercises(
    viewerId: number,
    targetId?: number,
  ): Promise<StatsExerciseResponseDto[]> {
    const profile = await this.target(viewerId, targetId);
    return this.stats.progressExercises(profile.userId);
  }

  /** Прогресс: лучший вес подхода по тренировкам, у упражнений без веса — лучшие повторы. */
  public async progress(
    viewerId: number,
    targetId: number | undefined,
    exerciseId: number,
  ): Promise<StatsPointResponseDto[]> {
    const profile = await this.target(viewerId, targetId);
    const { points } = await this.stats.progressPoints(
      profile.userId,
      exerciseId,
    );
    return points.map((p) => ({ date: isoDate(p.date), value: p.value }));
  }

  /** Прогресс весов по мышце: по каждому упражнению — график и «было → стало». */
  public async muscleProgress(
    viewerId: number,
    targetId: number | undefined,
    muscleId: number,
  ): Promise<StatsMuscleProgressResponseDto> {
    const profile = await this.target(viewerId, targetId);
    const { name, exercises } = await this.stats.muscleProgress(
      profile.userId,
      muscleId,
    );
    return {
      id: muscleId,
      name,
      exercises: exercises.map((e) => {
        const values = e.points.map((p) => p.value);
        return {
          id: e.id,
          name: e.name,
          unit: e.unit,
          first: values[0],
          last: values.at(-1)!,
          best: Math.max(...values),
          points: e.points.map((p) => ({
            date: isoDate(p.date),
            value: p.value,
          })),
        };
      }),
    };
  }

  /** Вес тела — только свой: друзьям он не виден. */
  public async bodyWeight(
    userId: number,
    days = 90,
  ): Promise<StatsPointResponseDto[]> {
    const profile = await this.accounts.profile(userId);
    const from = addDays(localToday(profile.timeZone), -days);
    const rows = await this.prisma.bodyWeight.findMany({
      where: { userId, date: { gte: from } },
      orderBy: { date: 'asc' },
      select: { date: true, value: true },
    });
    return rows.map((r) => ({ date: isoDate(r.date), value: Number(r.value) }));
  }

  /** Нагрузка по мышцам за неделю; «забыто» — ноль подходов за 2 недели. */
  public async muscleLoad(
    viewerId: number,
    targetId: number | undefined,
    weeksAgo = 0,
  ): Promise<StatsMuscleLoadResponseDto[]> {
    const profile = await this.target(viewerId, targetId);
    const today = localToday(profile.timeZone);
    const monday = addDays(weekStart(today), -7 * weeksAgo);
    const [muscles, week, recent] = await Promise.all([
      this.prisma.muscle.findMany({ orderBy: { bodyOrder: 'asc' } }),
      this.stats.muscleLoad(profile.userId, monday, addDays(monday, 6)),
      this.stats.muscleLoad(
        profile.userId,
        addDays(today, -(FORGOTTEN_DAYS - 1)),
        today,
      ),
    ]);
    // Пока тренировок не было совсем, «забыто всё» — шум, а не подсказка
    const anyRecent = [...recent.values()].some((v) => v > 0);
    return muscles.map((m) => ({
      muscleId: m.id,
      name: m.name,
      sets: Number((week.get(m.id) ?? 0).toFixed(1)),
      forgotten: anyRecent && !(recent.get(m.id) ?? 0),
    }));
  }

  // ── Календарь ───────────────────────────────────────────────────────────

  public async calendar(
    viewerId: number,
    targetId: number | undefined,
    month: string,
  ): Promise<StatsCalendarDayResponseDto[]> {
    const profile = await this.target(viewerId, targetId);
    const today = localToday(profile.timeZone);
    const first = parseDate(`${month}-01`);
    const next = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1),
    );
    const [days, workouts, pauses] = await this.monthFacts(
      profile.userId,
      first,
      next,
    );
    const result: StatsCalendarDayResponseDto[] = [];
    for (let date = first; date < next; date = addDays(date, 1)) {
      const day = days.find((d) => d.date.getTime() === date.getTime());
      const trained = workouts.some((w) => w.date.getTime() === date.getTime());
      result.push({
        date: isoDate(date),
        mark: this.markOf(date, today, day, trained, pauses),
      });
    }
    this.logger.debug(
      `Календарь: viewerId=${viewerId}, userId=${profile.userId}, ${month}`,
    );
    return result;
  }

  /** Детали дня: комплекс, упражнения, подходы и веса; для своих дней — на что можно исправить отметку. */
  public async day(
    viewerId: number,
    targetId: number | undefined,
    date: string,
  ): Promise<StatsDayResponseDto> {
    const profile = await this.target(viewerId, targetId);
    const today = localToday(profile.timeZone);
    const day = parseDate(date);
    const [planDay, workouts, pauses] = await Promise.all([
      this.prisma.planDay.findUnique({
        where: { userId_date: { userId: profile.userId, date: day } },
      }),
      this.prisma.workout.findMany({
        where: {
          userId: profile.userId,
          date: day,
          status: { in: ['FINISHED', 'AUTO_CLOSED'] },
        },
        orderBy: { id: 'asc' },
        include: {
          exercises: {
            orderBy: { position: 'asc' },
            include: {
              exercise: { select: { name: true, measure: true } },
              sets: { orderBy: { number: 'asc' } },
            },
          },
        },
      }),
      this.prisma.pause.findMany({ where: { userId: profile.userId } }),
    ]);
    const own = profile.userId === viewerId;
    const inWindow = day <= today && day >= addDays(today, -FIX_WINDOW_DAYS);
    const fixTo: ('DONE' | 'MISSED')[] = [];
    // Те же условия, что у исправления в боте (PollService.fixToDone / fixToMissed)
    if (own && inWindow && planDay?.type === 'PLANNED') {
      if (planDay.status === 'MISSED' || planDay.status === 'PENDING')
        fixTo.push('DONE');
      if (planDay.status === 'DONE' || planDay.status === 'PENDING')
        fixTo.push('MISSED');
    }
    return {
      date: isoDate(day),
      mark: this.markOf(
        day,
        today,
        planDay ?? undefined,
        workouts.length > 0,
        pauses,
      ),
      dayId: own ? (planDay?.id ?? null) : null,
      fixTo,
      workouts: workouts.map((w) => ({
        id: w.id,
        complexName: w.complexName,
        unplanned: w.unplanned,
        simple: w.mode === 'SIMPLE',
        exercises: w.exercises.map((e) => ({
          name: e.exercise.name,
          measure: e.exercise.measure,
          done: e.done,
          sets: e.sets.map((s) => ({ weight: Number(s.weight), reps: s.reps })),
          superset: e.superset,
        })),
      })),
    };
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /** Чья статистика: своя или друга. Не друг — «не найдено», без подробностей. */
  private async target(
    viewerId: number,
    targetId?: number,
  ): Promise<SportProfile> {
    if (!targetId || targetId === viewerId)
      return this.accounts.profile(viewerId);
    const friend = await this.prisma.user.findFirst({
      where: { id: targetId, ...friendOf(viewerId) },
      select: { sportProfile: true },
    });
    if (!friend?.sportProfile) throw new NotFoundException('Вы не друзья.');
    return friend.sportProfile;
  }

  private monthFacts(userId: number, from: Date, to: Date) {
    return Promise.all([
      this.prisma.planDay.findMany({
        where: { userId, date: { gte: from, lt: to } },
      }),
      this.prisma.workout.findMany({
        where: {
          userId,
          date: { gte: from, lt: to },
          status: { in: ['FINISHED', 'AUTO_CLOSED'] },
        },
        select: { date: true },
      }),
      this.prisma.pause.findMany({ where: { userId } }),
    ]);
  }

  private markOf(
    date: Date,
    today: Date,
    day: PlanDay | undefined,
    trained: boolean,
    pauses: { startDate: Date; endDate: Date | null; endedAt: Date | null }[],
  ): CalendarMark {
    if (day?.status === 'DONE' || trained) return 'DONE';
    if (day?.status === 'MISSED') return 'MISSED';
    if (day?.status === 'PAUSED') return 'PAUSED';
    if (date > today) return 'FUTURE';
    if (day?.status === 'PENDING')
      return day.type === 'RESCHEDULED' ? 'RESCHEDULED' : 'PENDING';
    const paused = pauses.some(
      (p) =>
        date >= p.startDate &&
        (!p.endDate || date <= p.endDate) &&
        (!p.endedAt || date <= p.endedAt),
    );
    return paused ? 'PAUSED' : 'REST';
  }
}
