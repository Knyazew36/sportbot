import { useInfiniteQuery } from '@tanstack/react-query';

import type { ProgressListParams } from '@sportbot/api/entities/stats';
import {
  statsControllerAttendance,
  statsControllerBodyWeight,
  statsControllerCalendar,
  statsControllerDay,
  statsControllerMuscleLoad,
  statsControllerProgress,
  statsControllerProgressList,
  statsControllerRecords,
  statsControllerSessions,
  statsControllerSummary,
} from '@sportbot/api/generated/stats/stats';

import { useLocalDb } from '@/shared/db';

import { LOCAL_ROOT, useLocalQuery } from '../../local-query';
import {
  readAttendanceWeeks,
  readBodyWeight,
  readCalendar,
  readDay,
  readMuscleLoad,
  readProgress,
  readProgressList,
  readRecords,
  readSessionsPage,
  readSummary,
} from './read-stats';

// Своя статистика — из базы телефона, считается без сети. Статистика друга (userId) — только с сервера:
// его тренировок на телефоне нет

const SESSIONS_PAGE = 20;

const withUser = (userId?: number) => (userId ? { userId } : undefined);

/** Чтение своей статистики; у друга — null, и ответ берётся у сервера */
const own = <T>(userId: number | undefined, read: () => T | null) => (userId ? null : read());

export const useStatsSummary = (userId?: number) =>
  useLocalQuery({
    key: ['stats', 'summary', userId ?? null],
    read: (db) => own(userId, () => readSummary(db)),
    fallback: () => statsControllerSummary(withUser(userId)),
  });

/** Посещаемость по неделям, % */
export const useAttendanceWeeks = (weeks: number, userId?: number) =>
  useLocalQuery({
    key: ['stats', 'attendance', weeks, userId ?? null],
    read: (db) => own(userId, () => readAttendanceWeeks(db, weeks)),
    fallback: () => statsControllerAttendance({ weeks, ...withUser(userId) }),
    keepPrevious: true,
  });

/** Прогресс по упражнениям за период: лучший подход, рост, «стоит» / «не делали» */
export const useProgressList = (params: ProgressListParams, userId?: number) =>
  useLocalQuery({
    key: ['stats', 'progress-list', params, userId ?? null],
    read: (db) => own(userId, () => readProgressList(db, params)),
    fallback: () => statsControllerProgressList({ ...params, ...withUser(userId) }),
    keepPrevious: true,
  });

/** Прогресс упражнения за период: шапка, точки и расчётный 1ПМ (у упражнений с весом) */
export const useProgress = (exerciseId: number, days: number, userId?: number) =>
  useLocalQuery({
    key: ['stats', 'progress', exerciseId, days, userId ?? null],
    read: (db) => own(userId, () => readProgress(db, exerciseId, days)),
    fallback: () => statsControllerProgress(exerciseId, { days, add_e1rm: true, ...withUser(userId) }),
    keepPrevious: true,
  });

/** История тренировок с упражнением, новые сверху, порциями */
export const useProgressSessions = (exerciseId: number, userId?: number) => {
  const db = useLocalDb();
  return useInfiniteQuery({
    queryKey: [LOCAL_ROOT, db ? 'db' : 'rest', 'stats', 'sessions', exerciseId, userId ?? null],
    queryFn: async ({ pageParam }) => {
      const local = db && !userId ? readSessionsPage(db, exerciseId, pageParam, SESSIONS_PAGE) : null;
      return local ?? statsControllerSessions(exerciseId, { page: pageParam, limit: SESSIONS_PAGE, ...withUser(userId) });
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta?.hasNextPage ? last.meta.page + 1 : undefined),
    staleTime: Infinity,
  });
};

/** Личные рекорды, новые сверху; без limit — все, без days — за всё время */
export const useRecords = ({ limit, days }: { limit?: number; days?: number }, userId?: number) =>
  useLocalQuery({
    key: ['stats', 'records', limit ?? null, days ?? null, userId ?? null],
    read: (db) => own(userId, () => readRecords(db, { limit, days })),
    fallback: () => statsControllerRecords({ ...(limit && { limit }), ...(days && { days }), ...withUser(userId) }),
    keepPrevious: true,
  });

/** Вес тела — только свой */
export const useBodyWeightStats = (days: number) =>
  useLocalQuery({
    key: ['stats', 'body-weight', days],
    read: (db) => readBodyWeight(db, days),
    fallback: () => statsControllerBodyWeight({ days }),
    keepPrevious: true,
  });

/** Подходов в неделю на мышцу, в среднем за последние weeks недель; «забыто» — ноль за весь срок */
export const useMuscleLoad = (weeks: number, userId?: number) =>
  useLocalQuery({
    key: ['stats', 'muscle-load', weeks, userId ?? null],
    read: (db) => own(userId, () => readMuscleLoad(db, weeks)),
    fallback: () => statsControllerMuscleLoad({ weeks, ...withUser(userId) }),
    keepPrevious: true,
  });

/** Отметки дней месяца; month — «2026-10» */
export const useCalendar = (month: string, userId?: number) =>
  useLocalQuery({
    key: ['stats', 'calendar', month, userId ?? null],
    read: (db) => own(userId, () => readCalendar(db, month)),
    fallback: () => statsControllerCalendar({ month, ...withUser(userId) }),
    keepPrevious: true,
  });

/** Отметки дней сразу из нескольких месяцев: неделя может задеть два */
export const useCalendarMonths = (months: string[]) => {
  const query = useLocalQuery({
    key: ['stats', 'calendar-months', months],
    read: (db) => {
      const all = months.map((month) => readCalendar(db, month));
      return all.every(Boolean) ? all.flatMap((m) => m!) : null;
    },
    fallback: async () => (await Promise.all(months.map((month) => statsControllerCalendar({ month })))).flat(),
  });
  return {
    marks: new Map((query.data ?? []).map((d) => [d.date, d.mark] as const)),
    isPending: query.isPending,
  };
};

/** Детали дня: комплекс, упражнения, подходы и как можно исправить отметку */
export const useStatsDay = (date: string | null, userId?: number) =>
  useLocalQuery({
    key: ['stats', 'day', date ?? '', userId ?? null],
    read: (db) => own(userId, () => readDay(db, date!)),
    fallback: () => statsControllerDay({ date: date!, ...withUser(userId) }),
    enabled: date != null,
  });

/** Детали дней считаются на телефоне мгновенно — заранее грузить нечего */
export const usePrefetchStatsDays = (_dates: string[]) => undefined;
