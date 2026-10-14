import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type {
  CalendarMark,
  StatsDayResponseDto,
  StatsMuscleExerciseResponseDto,
  StatsMuscleLoadResponseDto,
  StatsMuscleProgressResponseDto,
  StatsPointResponseDto,
  StatsSummaryResponseDto,
} from '@/shared/api/generated/model'
import {
  statsControllerAttendance,
  statsControllerBodyWeight,
  statsControllerCalendar,
  statsControllerDay,
  statsControllerMuscleLoad,
  statsControllerMuscleProgress,
  statsControllerProgress,
  statsControllerProgressExercises,
  statsControllerSummary,
} from '@/shared/api/generated/stats/stats'

export type StatsSummary = StatsSummaryResponseDto
export type StatsPoint = StatsPointResponseDto
export type StatsMuscleLoad = StatsMuscleLoadResponseDto
export type StatsMuscleProgress = StatsMuscleProgressResponseDto
export type StatsMuscleExercise = StatsMuscleExerciseResponseDto
export type StatsDay = StatsDayResponseDto
export type StatsMark = CalendarMark

// userId — статистика друга: бэк сам проверяет дружбу и прячет то, что другу не видно (business-tz, 10.1)
export const statsKeys = {
  all: ['stats'] as const,
  summary: (userId?: number) => ['stats', 'summary', userId ?? null] as const,
  attendance: (weeks: number, userId?: number) => ['stats', 'attendance', weeks, userId ?? null] as const,
  exercises: (userId?: number) => ['stats', 'exercises', userId ?? null] as const,
  progress: (exerciseId: number, userId?: number) => ['stats', 'progress', exerciseId, userId ?? null] as const,
  bodyWeight: (days: number) => ['stats', 'body-weight', days] as const,
  muscleLoad: (weeksAgo: number, userId?: number) => ['stats', 'muscle-load', weeksAgo, userId ?? null] as const,
  muscle: (muscleId: number, userId?: number) => ['stats', 'muscle', muscleId, userId ?? null] as const,
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

/** Упражнения, по которым есть веса — список для выбора графика */
export const useProgressExercises = (userId?: number) =>
  useQuery({
    queryKey: statsKeys.exercises(userId),
    queryFn: () => statsControllerProgressExercises(withUser(userId)),
  })

/** Лучший вес по тренировкам */
export const useProgress = (exerciseId: number | undefined, userId?: number) =>
  useQuery({
    queryKey: statsKeys.progress(exerciseId ?? 0, userId),
    queryFn: () => statsControllerProgress(exerciseId!, withUser(userId)),
    enabled: exerciseId != null,
    placeholderData: keepPreviousData,
  })

/** Вес тела — только свой: другу он не виден */
export const useBodyWeightStats = (days: number) =>
  useQuery({
    queryKey: statsKeys.bodyWeight(days),
    queryFn: () => statsControllerBodyWeight({ days }),
    placeholderData: keepPreviousData,
  })

/** Подходы на мышцу за неделю; weeksAgo — сколько недель назад */
export const useMuscleLoad = (weeksAgo: number, userId?: number) =>
  useQuery({
    queryKey: statsKeys.muscleLoad(weeksAgo, userId),
    queryFn: () => statsControllerMuscleLoad({ weeksAgo, ...withUser(userId) }),
    placeholderData: keepPreviousData,
  })

/** Прогресс весов по мышце: упражнения, где она основная, у каждого — график лучшего веса */
export const useMuscleProgress = (muscleId: number, userId?: number) =>
  useQuery({
    queryKey: statsKeys.muscle(muscleId, userId),
    queryFn: () => statsControllerMuscleProgress(muscleId, withUser(userId)),
  })

/** Отметки дней месяца; month — «2026-10» */
export const useCalendar = (month: string, userId?: number) =>
  useQuery({
    queryKey: statsKeys.calendar(month, userId),
    queryFn: () => statsControllerCalendar({ month, ...withUser(userId) }),
    placeholderData: keepPreviousData,
  })

/** Детали дня: комплекс, упражнения, подходы и как можно исправить отметку */
export const useStatsDay = (date: string | null, userId?: number) =>
  useQuery({
    queryKey: statsKeys.day(date ?? '', userId),
    queryFn: () => statsControllerDay({ date: date!, ...withUser(userId) }),
    enabled: date != null,
  })
