// Статистика без сервера — порт server stats/stats.service.ts и stats-app.service.ts на строках
// локальной базы (дни 'YYYY-MM-DD'). Запросов нет: история приходит готовыми строками
import type { CalendarMark, ExerciseMeasure, MuscleRole, PlanDayStatus, PlanDayType } from '../generated/model'
import {
  type BestSet,
  betterSet,
  bestIndexOf,
  bestSetOf,
  type ProgressUnit,
  type SetRow,
  unitOf,
} from './records'
import { addDays } from './time'

/** Период по умолчанию, дней */
export const DEFAULT_PERIOD_DAYS = 92
/** Последних точек в мини-графике списка */
const SPARK_POINTS = 12
/** «Стоит»: за столько дней ≥2 тренировки с упражнением, и ни одна не побила прежний лучший подход */
const STALL_DAYS = 21

export type ProgressStatus = 'growing' | 'flat' | 'stalled' | 'idle'

/**
 * Упражнение одной засчитанной тренировки с подходами. Порядок строк — как на сервере:
 * по дате тренировки, при равной — по порядку записи
 */
export type HistoryRow = {
  /** id экрана упражнения тренировки */
  id: number
  exerciseId: number
  name: string
  measure: ExerciseMeasure
  date: string
  sets: SetRow[]
}

export type ProgressPoint = BestSet & { date: string }

export type ExerciseProgress = {
  id: number
  name: string
  unit: ProgressUnit
  best: BestSet
  delta: number
  deltaUnit: ProgressUnit
  sessions: number
  lastDate: string
  status: ProgressStatus
  spark: number[]
}

const round1 = (value: number): number => Math.round(value * 10) / 10

/** Первый день периода из days дней, считая сегодня */
export const periodStart = (today: string, days = DEFAULT_PERIOD_DAYS) => addDays(today, -(days - 1))

// ── Посещаемость ────────────────────────────────────────────────────────────

/**
 * Выполненные / запланированные за период: в знаменателе DONE, MISSED и PENDING до сегодня;
 * PAUSED и разовые перенесённые дни не входят. Не больше 100%
 */
export const attendance = (
  days: { date: string; type: PlanDayType; status: PlanDayStatus }[],
  from: string,
  to: string,
  today: string,
) => {
  const own = days.filter(d => d.type === 'PLANNED' && d.date >= from && d.date <= to)
  const done = own.filter(d => d.status === 'DONE').length
  const planned = done + own.filter(d => d.status === 'MISSED' || (d.status === 'PENDING' && d.date < today)).length
  return { done, planned, percent: planned ? Math.min(100, Math.round((done / planned) * 100)) : 0 }
}

// ── Нагрузка ────────────────────────────────────────────────────────────────

/** Подходы на мышцу: основная — 1 за подход, вспомогательная — 0,5; простой режим — плановые подходы */
export const muscleLoad = (
  items: { detailed: boolean; sets: number; plannedSets: number; muscles: { muscleId: number; role: MuscleRole }[] }[],
) => {
  const load = new Map<number, number>()
  for (const item of items) {
    const sets = item.detailed ? item.sets : item.plannedSets
    for (const muscle of item.muscles)
      load.set(muscle.muscleId, (load.get(muscle.muscleId) ?? 0) + sets * (muscle.role === 'PRIMARY' ? 1 : 0.5))
  }
  return load
}

// ── Прогресс ────────────────────────────────────────────────────────────────

/**
 * Точка — лучший подход тренировки. Был хоть один подход с весом — тренировки без веса пропускаем:
 * «0 кг» на графике читается как провал
 */
export const progressOf = (rows: HistoryRow[], measure: ExerciseMeasure) => {
  const unit = unitOf(
    rows.flatMap(r => r.sets),
    measure,
  )
  return {
    unit,
    points: rows.flatMap((r): ProgressPoint[] => {
      const best = bestSetOf(r.sets, unit)
      return best ? [{ date: r.date, ...best }] : []
    }),
  }
}

const topOf = (points: ProgressPoint[]) => points.reduce((top, p) => (betterSet(p, top) ? p : top))

/** Рост за период: лучшая точка против первой; вес не менялся — рост в повторах */
const deltaOf = (points: ProgressPoint[], unit: ProgressUnit) => {
  if (points.length < 2) return { delta: 0, deltaUnit: unit }
  const first = points[0]!
  const top = topOf(points)
  if (unit === 'kg' && top.weight === first.weight) return { delta: top.reps - first.reps, deltaUnit: 'reps' as const }
  return { delta: round1(top.value - first.value), deltaUnit: unit }
}

/** «Не делали» — в периоде пусто; «стоит» — за STALL_DAYS ≥2 тренировки, и ни одна не побила лучшее до них */
const statusOf = (points: ProgressPoint[], period: ProgressPoint[], delta: number, today: string): ProgressStatus => {
  if (!period.length) return 'idle'
  const since = addDays(today, -(STALL_DAYS - 1))
  const recent = points.filter(p => p.date >= since)
  const before = points.filter(p => p.date < since)
  if (recent.length >= 2 && before.length) {
    const top = topOf(before)
    if (!recent.some(p => betterSet(p, top))) return 'stalled'
  }
  return delta > 0 ? 'growing' : 'flat'
}

/** Сводка упражнения за период; null — точек нет */
export const summarize = (rows: HistoryRow[], from: string, today: string): ExerciseProgress | null => {
  const first = rows[0]
  if (!first) return null
  const { unit, points } = progressOf(rows, first.measure)
  if (!points.length) return null
  const period = points.filter(p => p.date >= from)
  const { delta, deltaUnit } = deltaOf(period, unit)
  const top = topOf(points)
  return {
    id: first.exerciseId,
    name: first.name,
    unit,
    best: { weight: top.weight, reps: top.reps, value: top.value },
    delta,
    deltaUnit,
    sessions: period.length,
    lastDate: points.at(-1)!.date,
    status: statusOf(points, period, delta, today),
    spark: period.slice(-SPARK_POINTS).map(p => p.value),
  }
}

export const groupByExercise = (rows: HistoryRow[]) => {
  const groups = new Map<number, HistoryRow[]>()
  for (const row of rows) groups.set(row.exerciseId, [...(groups.get(row.exerciseId) ?? []), row])
  return groups
}

/** Список прогресса: основа программы сверху, давно заброшенные — в конце */
export const progressList = (
  rows: HistoryRow[],
  options: { from: string; today: string; status?: 'growing' | 'stalled'; limit?: number },
) => {
  const list = [...groupByExercise(rows).values()]
    .map(group => summarize(group, options.from, options.today))
    .filter((e): e is ExerciseProgress => !!e)
    .filter(e => !options.status || e.status === options.status)
    .sort(
      (a, b) =>
        Number(a.status === 'idle') - Number(b.status === 'idle') ||
        b.sessions - a.sessions ||
        a.name.localeCompare(b.name, 'ru'),
    )
  return options.limit ? list.slice(0, options.limit) : list
}

/** Расчётный 1ПМ по Эпли: лучший из подходов с весом; один повтор — и есть максимум */
export const e1rmOf = (sets: SetRow[]) => {
  let best: { value: number; weight: number; reps: number } | null = null
  for (const s of sets) {
    if (s.weight <= 0 || s.reps <= 0) continue
    const value = round1(s.reps === 1 ? s.weight : s.weight * (1 + s.reps / 30))
    if (!best || value > best.value) best = { value, weight: s.weight, reps: s.reps }
  }
  return best
}

/** Прогресс одного упражнения: шапка, точки периода и, по запросу, расчётный 1ПМ (только по весу) */
export const exerciseProgress = (
  rows: HistoryRow[],
  exercise: { id: number; name: string; measure: ExerciseMeasure },
  options: { from: string; today: string; addE1rm?: boolean },
) => {
  const { unit, points } = progressOf(rows, exercise.measure)
  const result = {
    id: exercise.id,
    name: exercise.name,
    unit,
    summary: rows.length ? summarize(rows, options.from, options.today) : null,
    points: points.filter(p => p.date >= options.from),
  }
  if (!options.addE1rm || unit !== 'kg') return result
  const all = rows.flatMap(r => {
    const estimate = e1rmOf(r.sets)
    return estimate ? [{ date: r.date, ...estimate }] : []
  })
  const period = all.filter(p => p.date >= options.from)
  const best = period.length ? period.reduce((top, p) => (p.value > top.value ? p : top)) : null
  const view = (e: (typeof all)[number] | null) => e && { value: e.value, weight: e.weight, reps: e.reps }
  return {
    ...result,
    e1rm: {
      current: view(all.at(-1) ?? null),
      best: view(best),
      points: period.map(({ date, value }) => ({ date, value })),
    },
  }
}

/** id строк, где лучший подход побил все более ранние. Первая тренировка — не рекорд */
const recordRows = (rows: HistoryRow[], unit: ProgressUnit) => {
  const result = new Set<number>()
  let top: BestSet | null = null
  for (const row of rows) {
    const best = bestSetOf(row.sets, unit)
    if (!best) continue
    if (top && betterSet(best, top)) result.add(row.id)
    if (!top || betterSet(best, top)) top = best
  }
  return result
}

/** История тренировок с упражнением, новые сверху: подходы, лучший из них, был ли рекорд */
export const sessionsOf = (rows: HistoryRow[]) => {
  const unit = progressOf(rows, rows[0]?.measure ?? 'REPS').unit
  const records = recordRows(rows, unit)
  return [...rows].reverse().map(r => ({
    id: r.id,
    date: r.date,
    sets: r.sets.map(s => ({ weight: s.weight, reps: s.reps })),
    bestIndex: bestIndexOf(r.sets, unit),
    isRecord: records.has(r.id),
  }))
}

/** Лента рекордов, новые сверху; from — только рекорды с этой даты, сравнение — со всей историей */
export const recordsFeed = (rows: HistoryRow[], options: { from?: string; limit?: number } = {}) => {
  const feed: {
    date: string
    exerciseId: number
    name: string
    unit: ProgressUnit
    set: BestSet
    previous: BestSet
  }[] = []
  for (const [exerciseId, group] of groupByExercise(rows)) {
    const { unit, points } = progressOf(group, group[0]!.measure)
    let top: ProgressPoint | null = null
    for (const point of points) {
      if (top && betterSet(point, top) && (!options.from || point.date >= options.from))
        feed.push({
          date: point.date,
          exerciseId,
          name: group[0]!.name,
          unit,
          set: { weight: point.weight, reps: point.reps, value: point.value },
          previous: { weight: top.weight, reps: top.reps, value: top.value },
        })
      if (!top || betterSet(point, top)) top = point
    }
  }
  // Стабильная сортировка: при одной дате порядок — как у сервера (по упражнениям)
  feed.sort((a, b) => b.date.localeCompare(a.date))
  return options.limit ? feed.slice(0, options.limit) : feed
}

// ── Календарь ───────────────────────────────────────────────────────────────

/** Отметка дня календаря статистики — как markOf в StatsAppService */
export const calendarMark = (
  date: string,
  today: string,
  day: { status: PlanDayStatus; type: PlanDayType } | undefined,
  trained: boolean,
  pauses: { startDate: string; endDate: string | null; endedAt: string | null }[],
): CalendarMark => {
  if (day?.status === 'DONE' || trained) return 'DONE'
  if (day?.status === 'MISSED') return 'MISSED'
  if (day?.status === 'PAUSED') return 'PAUSED'
  if (date > today) return 'FUTURE'
  // Прошедший день крон закроет только через сутки, но для календаря он уже пропуск
  if (day?.status === 'PENDING' && date < today) return day.type === 'RESCHEDULED' ? 'REST' : 'MISSED'
  if (day?.status === 'PENDING') return day.type === 'RESCHEDULED' ? 'RESCHEDULED' : 'PENDING'
  // endedAt — момент, а дата — день: сравниваем по дню снятия
  const paused = pauses.some(
    p => date >= p.startDate && (!p.endDate || date <= p.endDate) && (!p.endedAt || date <= p.endedAt.slice(0, 10)),
  )
  return paused ? 'PAUSED' : 'REST'
}
