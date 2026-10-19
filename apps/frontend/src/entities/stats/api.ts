import { keepPreviousData, useInfiniteQuery, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'

import { useEffect } from 'react'

import type {
  CalendarMark,
  StatsControllerProgressListParams,
  StatsDayResponseDto,
  StatsMuscleLoadResponseDto,
  StatsPointResponseDto,
  StatsProgressItemResponseDto,
  StatsProgressResponseDto,
  StatsRecordResponseDto,
  StatsSessionResponseDto,
  StatsSummaryResponseDto,
} from '@/shared/api/generated/model'
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
} from '@/shared/api/generated/stats/stats'

export type StatsSummary = StatsSummaryResponseDto
export type StatsPoint = StatsPointResponseDto
export type StatsMuscleLoad = StatsMuscleLoadResponseDto
export type StatsProgressItem = StatsProgressItemResponseDto
export type StatsProgress = StatsProgressResponseDto
export type StatsSession = StatsSessionResponseDto
export type StatsRecord = StatsRecordResponseDto
export type StatsDay = StatsDayResponseDto
export type StatsMark = CalendarMark

/** Фильтры списка прогресса: период в днях, мышца, «растут / стоят», поиск, сколько первых */
export type ProgressListParams = Pick<
  StatsControllerProgressListParams,
  'days' | 'filter_muscle' | 'filter_status' | 'search' | 'limit'
>

const SESSIONS_PAGE = 20

// userId — статистика друга: бэк сам проверяет дружбу и прячет то, что другу не видно (business-tz, 10.1)
export const statsKeys = {
  all: ['stats'] as const,
  summary: (userId?: number) => ['stats', 'summary', userId ?? null] as const,
  attendance: (weeks: number, userId?: number) => ['stats', 'attendance', weeks, userId ?? null] as const,
  progressList: (params: ProgressListParams, userId?: number) =>
    ['stats', 'progress-list', params, userId ?? null] as const,
  progress: (exerciseId: number, days: number, userId?: number) =>
    ['stats', 'progress', exerciseId, days, userId ?? null] as const,
  sessions: (exerciseId: number, userId?: number) => ['stats', 'sessions', exerciseId, userId ?? null] as const,
  records: (limit: number | null, days: number | null, userId?: number) =>
    ['stats', 'records', limit, days, userId ?? null] as const,
  bodyWeight: (days: number) => ['stats', 'body-weight', days] as const,
  muscleLoad: (weeks: number, userId?: number) => ['stats', 'muscle-load', weeks, userId ?? null] as const,
  calendar: (month: string, userId?: number) => ['stats', 'calendar', month, userId ?? null] as const,
  day: (date: string, userId?: number) => ['stats', 'day', date, userId ?? null] as const,
}

const withUser = (userId?: number) => (userId ? { userId } : undefined)

export const useStatsSummary = (userId?: number) =>
  useQuery({
    queryKey: statsKeys.summary(userId),
    queryFn: () => statsControllerSummary(withUser(userId)),
  })

/** Посещаемость по неделям, % */
export const useAttendanceWeeks = (weeks: number, userId?: number) =>
  useQuery({
    queryKey: statsKeys.attendance(weeks, userId),
    queryFn: () => statsControllerAttendance({ weeks, ...withUser(userId) }),
    placeholderData: keepPreviousData,
  })

/** Прогресс по упражнениям за период: лучший подход, рост, «стоит» / «не делали» */
export const useProgressList = (params: ProgressListParams, userId?: number) =>
  useQuery({
    queryKey: statsKeys.progressList(params, userId),
    queryFn: () => statsControllerProgressList({ ...params, ...withUser(userId) }),
    placeholderData: keepPreviousData,
  })

/** Прогресс упражнения за период: шапка, точки и расчётный 1ПМ (у упражнений с весом) */
export const useProgress = (exerciseId: number, days: number, userId?: number) =>
  useQuery({
    queryKey: statsKeys.progress(exerciseId, days, userId),
    queryFn: () => statsControllerProgress(exerciseId, { days, add_e1rm: true, ...withUser(userId) }),
    placeholderData: keepPreviousData,
  })

/** История тренировок с упражнением, новые сверху, порциями */
export const useProgressSessions = (exerciseId: number, userId?: number) =>
  useInfiniteQuery({
    queryKey: statsKeys.sessions(exerciseId, userId),
    queryFn: ({ pageParam }) =>
      statsControllerSessions(exerciseId, { page: pageParam, limit: SESSIONS_PAGE, ...withUser(userId) }),
    initialPageParam: 1,
    getNextPageParam: last => (last.meta?.hasNextPage ? last.meta.page + 1 : undefined),
  })

/** Личные рекорды, новые сверху; без limit — все, без days — за всё время */
export const useRecords = ({ limit, days }: { limit?: number; days?: number }, userId?: number) =>
  useQuery({
    queryKey: statsKeys.records(limit ?? null, days ?? null, userId),
    queryFn: () => statsControllerRecords({ ...(limit && { limit }), ...(days && { days }), ...withUser(userId) }),
    placeholderData: keepPreviousData,
  })

/** Вес тела — только свой: другу он не виден */
export const useBodyWeightStats = (days: number) =>
  useQuery({
    queryKey: statsKeys.bodyWeight(days),
    queryFn: () => statsControllerBodyWeight({ days }),
    placeholderData: keepPreviousData,
  })

/** Подходов в неделю на мышцу, в среднем за последние weeks недель; «забыто» — ноль за весь срок */
export const useMuscleLoad = (weeks: number, userId?: number) =>
  useQuery({
    queryKey: statsKeys.muscleLoad(weeks, userId),
    queryFn: () => statsControllerMuscleLoad({ weeks, ...withUser(userId) }),
    placeholderData: keepPreviousData,
  })

/** Отметки дней месяца; month — «2026-10» */
export const useCalendar = (month: string, userId?: number) =>
  useQuery({
    queryKey: statsKeys.calendar(month, userId),
    queryFn: () => statsControllerCalendar({ month, ...withUser(userId) }),
    placeholderData: keepPreviousData,
  })

const calendarQuery = (month: string, userId?: number) => ({
  queryKey: statsKeys.calendar(month, userId),
  queryFn: () => statsControllerCalendar({ month, ...withUser(userId) }),
})

/**
 * Отметки дней сразу из нескольких месяцев: неделя может задеть два.
 * prefetch — месяцы, которые понадобятся следующими (прошлая неделя), чтобы листание не мигало пустотой
 */
export const useCalendarMonths = (months: string[], prefetch: string[] = []) => {
  const queryClient = useQueryClient()
  const prefetchKey = prefetch.join(',')
  useEffect(() => {
    for (const month of prefetchKey.split(',').filter(Boolean)) void queryClient.prefetchQuery(calendarQuery(month))
  }, [prefetchKey, queryClient])

  return useQueries({
    queries: months.map(month => calendarQuery(month)),
    combine: results => ({
      marks: new Map(results.flatMap(r => r.data ?? []).map(d => [d.date, d.mark] as const)),
      isPending: results.some(r => r.isPending),
    }),
  })
}

/** Детали дня: комплекс, упражнения, подходы и как можно исправить отметку */
export const useStatsDay = (date: string | null, userId?: number) =>
  useQuery({
    queryKey: statsKeys.day(date ?? '', userId),
    queryFn: () => statsControllerDay({ date: date!, ...withUser(userId) }),
    enabled: date != null,
  })
