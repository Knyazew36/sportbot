// Личные рекорды тренировки без сервера — порт StatsService.records и помощников (server stats/stats.service.ts)
import type { ExerciseMeasure } from '../generated/model'

/** В чём считается прогресс: вес или, если веса нет, повторы; на время — секунды или минуты */
export type ProgressUnit = 'kg' | 'reps' | 'sec' | 'min'

export type BestSet = { weight: number; reps: number; value: number }

export type SetRow = { weight: number; reps: number }

export type PersonalRecord = {
  exerciseId: number
  name: string
  unit: ProgressUnit
  value: number
  /** Повторы лучшего подхода: при том же весе рекорд — это больше повторов */
  reps: number
  previous: number
  previousReps: number
}

/** Подход a лучше b: больше вес, при равном весе — больше повторов. Без веса сравниваются повторы */
export const betterSet = (a: BestSet, b: BestSet): boolean => (a.weight !== b.weight ? a.weight > b.weight : a.reps > b.reps)

export const timedUnit = (measure: ExerciseMeasure): ProgressUnit | null =>
  measure === 'MINUTES' ? 'min' : measure === 'TIME' ? 'sec' : null

/** Секунды подхода в единице прогресса: у кардио минуты с одним знаком */
export const fromSeconds = (unit: ProgressUnit | null, value: number): number => (unit === 'min' ? Math.round(value / 6) / 10 : value)

export const unitOf = (sets: SetRow[], measure: ExerciseMeasure): ProgressUnit =>
  timedUnit(measure) ?? (sets.some(s => s.weight > 0) ? 'kg' : 'reps')

/** Номер лучшего подхода; -1 — подходов с весом нет */
export const bestIndexOf = (sets: SetRow[], unit: ProgressUnit): number => {
  // Без веса вес не сравниваем: случайные «2,5 кг» в отжиманиях не должны перебить повторы
  const asSet = (s: SetRow): BestSet => ({ weight: unit === 'kg' ? s.weight : 0, reps: s.reps, value: 0 })
  let best = -1
  sets.forEach((s, i) => {
    if (unit === 'kg' && s.weight <= 0) return
    if (best < 0 || betterSet(asSet(s), asSet(sets[best]!))) best = i
  })
  return best
}

export const bestSetOf = (sets: SetRow[], unit: ProgressUnit): BestSet | null => {
  const index = bestIndexOf(sets, unit)
  if (index < 0) return null
  const set = sets[index]!
  return unit === 'kg'
    ? { weight: set.weight, reps: set.reps, value: set.weight }
    : { weight: 0, reps: set.reps, value: fromSeconds(unit, set.reps) }
}

/**
 * Рекорды тренировки: лучший подход упражнения лучше всего, что было до неё.
 * history — подходы этих упражнений в засчитанных тренировках, начатых раньше этой
 */
export const workoutRecords = (
  today: { exerciseId: number; name: string; measure: ExerciseMeasure; sets: SetRow[] }[],
  history: { exerciseId: number; sets: SetRow[] }[],
): PersonalRecord[] => {
  const byExercise = new Map<number, { name: string; measure: ExerciseMeasure; sets: SetRow[] }>()
  for (const item of today) {
    if (!item.sets.length) continue
    const entry = byExercise.get(item.exerciseId) ?? { name: item.name, measure: item.measure, sets: [] }
    entry.sets.push(...item.sets)
    byExercise.set(item.exerciseId, entry)
  }
  const records: PersonalRecord[] = []
  for (const [exerciseId, { name, measure, sets }] of byExercise) {
    const before = history.filter(h => h.exerciseId === exerciseId).flatMap(h => h.sets)
    if (!before.length) continue
    const unit = unitOf([...before, ...sets], measure)
    const best = bestSetOf(sets, unit)
    const previous = bestSetOf(before, unit)
    // Подходов с весом раньше не было — сравнивать не с чем
    if (!previous || !best || !betterSet(best, previous)) continue
    records.push({
      exerciseId,
      name,
      unit,
      value: best.value,
      reps: best.reps,
      previous: previous.value,
      previousReps: previous.reps,
    })
  }
  return records
}
