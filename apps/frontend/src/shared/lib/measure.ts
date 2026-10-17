// Мера упражнения — как на сервере (server catalog/measure.ts). REPS — подходы × повторы × вес.
// TIME и MINUTES — на время: в плане (repsMin/repsMax) и в подходе (reps) лежат секунды, веса нет.
// TIME — удержания (планка), вводятся секундами; MINUTES — кардио (дорожка, скакалка), минутами одним числом
export type Measure = 'REPS' | 'TIME' | 'MINUTES'

export const MEASURE_LABEL: Record<Measure, string> = { REPS: 'Повторы', TIME: 'Секунды', MINUTES: 'Минуты' }

/** Упражнение на время: в reps — секунды */
export const isTimed = (measure: Measure) => measure === 'TIME' || measure === 'MINUTES'

/** Границы плана и подхода: повторы как раньше, время — до 4 часов */
export const MEASURE_LIMITS: Record<Measure, { plan: number; set: number }> = {
  REPS: { plan: 200, set: 999 },
  TIME: { plan: 14_400, set: 14_400 },
  MINUTES: { plan: 14_400, set: 14_400 },
}

const pad = (n: number) => String(n).padStart(2, '0')

/** «1:30» — минуты и секунды */
export const clockText = (seconds: number) => `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`

/** «45 с», «20 мин», «1:30» */
export const durationText = (seconds: number) => {
  if (seconds < 60) return `${seconds} с`
  if (seconds % 60 === 0) return `${seconds / 60} мин`
  return clockText(seconds)
}

/** Диапазон плана: «8–12», «30–60 с», «20 мин», «1:00–1:30» */
export const rangeText = (measure: Measure, min: number, max: number) => {
  if (!isTimed(measure)) return min === max ? `${min}` : `${min}–${max}`
  if (min === max) return durationText(min)
  // Обе границы в минутах или обе меньше двух минут — одна единица на весь диапазон
  if (min % 60 === 0 && max % 60 === 0) return `${min / 60}–${max / 60} мин`
  if (max < 120) return `${min}–${max} с`
  return `${clockText(min)}–${clockText(max)}`
}

/** План подходов: «3 × 8–12», «3 × 30–60 с», «1 × 20 мин» */
export const planText = (sets: number, repsMin: number, repsMax: number, measure: Measure = 'REPS') =>
  `${sets} × ${rangeText(measure, repsMin, repsMax)}`

/** Время из ввода: «45» — секунды, «1:30» — минуты и секунды. null — не разобрать */
export const parseDuration = (input: string): number | null => {
  const match = /^\s*(?:(\d{1,3}):([0-5]\d)|(\d{1,5}))\s*$/.exec(input)
  if (!match) return null
  return match[3] !== undefined ? Number(match[3]) : Number(match[1]) * 60 + Number(match[2])
}

/** Время из ввода по мере: у кардио число — минуты («20»), у удержания — секунды («45»); «мм:сс» понимают обе */
export const parseTime = (measure: Measure, input: string): number | null => {
  if (measure === 'MINUTES' && /^\s*\d{1,3}\s*$/.test(input)) return Number(input) * 60
  return parseDuration(input)
}

/** Секунды в поле ввода: у кардио — минуты («20», с секундами — «20:30»), у удержания — секунды или «мм:сс» */
export const timeInput = (measure: Measure, seconds: number) => {
  if (measure === 'MINUTES') return seconds % 60 === 0 ? String(seconds / 60) : clockText(seconds)
  return seconds < 60 ? String(seconds) : clockText(seconds)
}

/** Подпись поля времени */
export const timeLabel = (measure: Measure) => (measure === 'MINUTES' ? 'минуты' : 'секунды')
