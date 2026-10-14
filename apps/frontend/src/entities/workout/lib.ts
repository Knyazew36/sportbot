import type { WorkoutItem } from './api'

const num = (value: number) => String(Number(value.toFixed(2)))

/** План подходов: «3 × 8–12» */
export const planText = (sets: number, repsMin: number, repsMax: number) =>
  `${sets} × ${repsMin === repsMax ? repsMin : `${repsMin}–${repsMax}`}`

/** Прошлый раз одной строкой: «60 × 8, 8, 7»; разный вес — «60×8, 55×10». null — истории нет */
export const lastText = (last: WorkoutItem['last']): string | null => {
  if (!last?.sets.length) return null
  const weights = new Set(last.sets.map(s => s.weight))
  const w = (value: number) => (value === 0 ? 'свой вес' : num(value))
  if (weights.size === 1) return `${w(last.sets[0]!.weight)} × ${last.sets.map(s => s.reps).join(', ')}`
  return last.sets.map(s => `${w(s.weight)}×${s.reps}`).join(', ')
}

/** Подсказка к полю подхода: значение того же подхода в прошлый раз */
export const lastSetHint = (last: WorkoutItem['last'], number: number) => last?.sets[number - 1]

export const weightText = (weight: number) => (weight === 0 ? 'свой' : num(weight))
