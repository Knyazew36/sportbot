// Расчёты силы поверх готовой истории: ориентир объёма, сила относительно веса тела, цель на тренировку.
// Чистые функции без запросов — одинаково работают в вебе и в мобилке
import { isTimed, type Measure } from './measure'

// ── Объём ───────────────────────────────────────────────────────────────────

/** Ориентир для роста мышцы: подходов на мышцу в неделю (обзоры по гипертрофии дают 10–20) */
export const WEEKLY_SETS_MIN = 10
export const WEEKLY_SETS_MAX = 20

export type VolumeZone = 'low' | 'ok' | 'high'

export const volumeZone = (weeklySets: number): VolumeZone =>
  weeklySets < WEEKLY_SETS_MIN ? 'low' : weeklySets > WEEKLY_SETS_MAX ? 'high' : 'ok'

// ── Сила относительно веса тела ─────────────────────────────────────────────

/** Во сколько раз расчётный максимум больше веса тела; null — веса тела нет */
export const relativeStrength = (e1rm: number, bodyWeight: number | null | undefined): number | null =>
  bodyWeight && bodyWeight > 0 && e1rm > 0 ? Math.round((e1rm / bodyWeight) * 100) / 100 : null

// ── Цель на тренировку ──────────────────────────────────────────────────────

/** Шаг прибавки: на лёгких весах 2,5 кг — это скачок, там прибавляют по килограмму */
const stepOf = (weight: number) => (weight < 20 ? 1 : 2.5)

export type NextTarget = {
  weight: number
  reps: number
  /** add-weight — верхняя граница повторов взята во всех подходах, пора прибавить вес */
  kind: 'add-weight' | 'add-reps'
}

/** Почему такая цель: одна строка под значением */
export const TARGET_REASON: Record<NextTarget['kind'], string> = {
  'add-weight': 'в прошлый раз везде верх диапазона — прибавь вес',
  'add-reps': 'ещё повтор к прошлому разу',
}

/**
 * Двойная прогрессия: сначала добираем повторы до верха диапазона, потом прибавляем вес и начинаем с низа.
 * Смотрим на подходы с самым тяжёлым весом прошлого раза: разминочные не в счёт.
 * null — подсказывать нечего: упражнение на время, свой вес или истории нет
 */
export const nextTarget = (
  last: { sets: { weight: number; reps: number }[] } | null | undefined,
  plan: { repsMin: number; repsMax: number; measure: Measure },
): NextTarget | null => {
  if (!last?.sets.length || isTimed(plan.measure)) return null
  const top = Math.max(...last.sets.map(s => s.weight))
  if (top <= 0) return null
  const working = last.sets.filter(s => s.weight === top)
  if (working.every(s => s.reps >= plan.repsMax))
    return { weight: Math.round((top + stepOf(top)) * 100) / 100, reps: plan.repsMin, kind: 'add-weight' }
  // Не выше верха диапазона: цель «прибавь ещё повтор» не должна выходить за план
  const weakest = Math.min(...working.map(s => s.reps))
  return { weight: top, reps: Math.min(plan.repsMax, weakest + 1), kind: 'add-reps' }
}
