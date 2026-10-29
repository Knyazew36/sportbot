import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { addDays, localToday, monthStart, weekdayOf, weekStart } from '@/bot';
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
import { StatsE1rmSetResponseDto } from './dto/stats-e1rm-set.response.dto';
import { StatsMuscleLoadResponseDto } from './dto/stats-muscle-load.response.dto';
import { StatsPointResponseDto } from './dto/stats-point.response.dto';
import { StatsProgressItemResponseDto } from './dto/stats-progress-item.response.dto';
import { StatsProgressListQueryDto } from './dto/stats-progress-list-query.dto';
import { StatsProgressQueryDto } from './dto/stats-progress-query.dto';
import { StatsProgressResponseDto } from './dto/stats-progress.response.dto';
import { StatsRecordResponseDto } from './dto/stats-record.response.dto';
import { StatsRecordsQueryDto } from './dto/stats-records-query.dto';
import { StatsSessionResponseDto } from './dto/stats-session.response.dto';
import { StatsSessionsQueryDto } from './dto/stats-sessions-query.dto';
import { StatsSummaryResponseDto } from './dto/stats-summary.response.dto';
import { E1rm, ExerciseProgress, StatsService } from './stats.service';

const DEFAULT_PERIOD_DAYS = 92;
const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
const parseDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

/** Первый день периода из days дней, считая сегодня. */
const periodStart = (today: Date, days = DEFAULT_PERIOD_DAYS): Date =>
  addDays(today, -(days - 1));

const e1rmView = (e: E1rm | null): StatsE1rmSetResponseDto | null =>
  e && { value: e.value, weight: e.weight, reps: e.reps };

const itemView = (e: ExerciseProgress): StatsProgressItemResponseDto => ({
  ...e,
  lastDate: isoDate(e.lastDate),
});

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

  /** Прогресс по упражнениям за период: лучший подход, рост, «стоит» / «не делали». */
  public async progressList(
    viewerId: number,
    query: StatsProgressListQueryDto,
  ): Promise<StatsProgressItemResponseDto[]> {
    const profile = await this.target(viewerId, query.userId);
    const today = localToday(profile.timeZone);
    const list = await this.stats.progressList(profile.userId, {
      from: periodStart(today, query.days),
      today,
      muscleId: query.filter_muscle,
      status: query.filter_status,
      search: query.search,
      limit: query.limit,
    });
    return list.map(itemView);
  }

  /** Прогресс упражнения: шапка, точки периода, по запросу — расчётный 1ПМ. */
  public async progress(
    viewerId: number,
    exerciseId: number,
    query: StatsProgressQueryDto,
  ): Promise<StatsProgressResponseDto> {
    const profile = await this.target(viewerId, query.userId);
    const today = localToday(profile.timeZone);
    const result = await this.stats.exerciseProgress(
      profile.userId,
      exerciseId,
      { from: periodStart(today, query.days), today, addE1rm: query.add_e1rm },
    );
    return {
      id: exerciseId,
      name: result.name,
      unit: result.unit,
      summary: result.summary && itemView(result.summary),
      points: result.points.map((p) => ({ ...p, date: isoDate(p.date) })),
      e1rm: result.e1rm && {
        current: e1rmView(result.e1rm.current),
        best: e1rmView(result.e1rm.best),
        points: result.e1rm.points.map((p) => ({
          date: isoDate(p.date),
          value: p.value,
        })),
      },
    };
  }

  /** История тренировок с упражнением, новые сверху. */
  public async sessions(
    viewerId: number,
    exerciseId: number,
    query: StatsSessionsQueryDto,
  ) {
    const profile = await this.target(viewerId, query.userId);
    const { items, meta } = await this.stats.sessions(
      profile.userId,
      exerciseId,
      query.page ?? 1,
      query.limit ?? 25,
    );
    return {
      meta,
      items: items.map(
        (s): StatsSessionResponseDto => ({ ...s, date: isoDate(s.date) }),
      ),
    };
  }

  /** Лента личных рекордов, новые сверху. */
  public async records(
    viewerId: number,
    query: StatsRecordsQueryDto,
  ): Promise<StatsRecordResponseDto[]> {
    const profile = await this.target(viewerId, query.userId);
    const today = localToday(profile.timeZone);
    const feed = await this.stats.recordsFeed(profile.userId, {
      from: query.days ? periodStart(today, query.days) : undefined,
      limit: query.limit,
    });
    return feed.map((r) => ({ ...r, date: isoDate(r.date) }));
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

  /**
   * Баланс мышц: подходов в неделю в среднем за последние weeks недель. Одна неделя — шум:
   * пропущенная тренировка переворачивает картину. «Забыто» — ноль подходов за весь период.
   */
  public async muscleLoad(
    viewerId: number,
    targetId: number | undefined,
    weeks = 4,
  ): Promise<StatsMuscleLoadResponseDto[]> {
    const profile = await this.target(viewerId, targetId);
    const today = localToday(profile.timeZone);
    // Новичок за неделю иначе получил бы среднее за год, поделённое на 52, — сплошные нули
    const known = Math.ceil(
      (today.getTime() - profile.createdAt.getTime() + 1) / (7 * 86_400_000),
    );
    weeks = Math.max(1, Math.min(weeks, known));
    const [muscles, load] = await Promise.all([
      this.prisma.muscle.findMany({ orderBy: { bodyOrder: 'asc' } }),
      this.stats.muscleLoad(
        profile.userId,
        addDays(today, -(7 * weeks - 1)),
        today,
      ),
    ]);
    // Пока тренировок не было совсем, «забыто всё» — шум, а не подсказка
    const anyLoad = [...load.values()].some((v) => v > 0);
    return muscles.map((m) => ({
      muscleId: m.id,
      name: m.name,
      sets: Number(((load.get(m.id) ?? 0) / weeks).toFixed(1)),
      forgotten: anyLoad && !(load.get(m.id) ?? 0),
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
        mark: this.markOf(profile, date, today, day, trained, pauses),
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
        profile,
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
        startedAt: w.startedAt.toISOString(),
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
    profile: SportProfile,
    date: Date,
    today: Date,
    day: PlanDay | undefined,
    trained: boolean,
    pauses: { startDate: Date; endDate: Date | null; endedAt: Date | null }[],
  ): CalendarMark {
    if (day?.status === 'DONE' || trained) return 'DONE';
    if (day?.status === 'MISSED') return 'MISSED';
    if (day?.status === 'PAUSED') return 'PAUSED';
    // Прошедший день крон закроет только через сутки (окно, чтобы отметить вчерашнюю тренировку),
    // но для календаря он уже пропуск; несостоявшийся перенос крон снимет — значит, отдых
    if (day?.status === 'PENDING' && date < today)
      return day.type === 'RESCHEDULED' ? 'REST' : 'MISSED';
    const paused = pauses.some(
      (p) =>
        date >= p.startDate &&
        (!p.endDate || date <= p.endDate) &&
        (!p.endedAt || date <= p.endedAt),
    );
    if (paused) return 'PAUSED';
    if (day?.status === 'PENDING') return 'PLAN';
    // Впереди дней плана ещё нет — тренировочный день берём из расписания
    return date >= today && profile.trainingDays.includes(weekdayOf(date))
      ? 'PLAN'
      : 'REST';
  }
}
