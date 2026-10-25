import type { ProgressUnit as GeneratedProgressUnit, StatsBestSetResponseDto } from '../../../generated/model'
import { durationText } from '../../../lib/measure'

export type ProgressUnit = GeneratedProgressUnit

// Прогресс считается по лучшему подходу: у упражнений с весом — вес и повторы, без веса (брусья,
// подтягивания) — повторы, на время (планка, кардио) — секунды или минуты. Решает бэк
export const PROGRESS_UNIT: Record<ProgressUnit, { short: string; aside: string }> = {
  kg: { short: 'кг', aside: 'лучший подход за тренировку' },
  reps: { short: 'повт.', aside: 'лучший подход по повторам' },
  sec: { short: 'с', aside: 'лучшее время подхода' },
  min: { short: 'мин', aside: 'лучшее время подхода' },
}

const num = (value: number) => value.toLocaleString('ru-RU')

/** Подход текстом: «65 кг × 8», без веса — «12 повт.», на время — «1:30» */
export const setText = (set: Pick<StatsBestSetResponseDto, 'weight' | 'reps' | 'value'>, unit: ProgressUnit) => {
  if (unit === 'kg') return `${num(set.weight)} кг × ${set.reps}`
  if (unit === 'sec') return durationText(set.value)
  return `${num(set.value)} ${PROGRESS_UNIT[unit].short}`
}

/** Рост текстом: «+7,5 кг», «+3 повт.»; без роста — null */
export const deltaText = (delta: number, unit: ProgressUnit) => {
  if (delta <= 0) return null
  return unit === 'sec' ? `+${durationText(delta)}` : `+${num(delta)} ${PROGRESS_UNIT[unit].short}`
}
