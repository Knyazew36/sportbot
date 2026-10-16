import { supersetLetter } from '@/shared/lib/superset'

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

// ── Суперсет ────────────────────────────────────────────────────────────────
// Круг считаем по очереди подходов, а не по серверу: без сети круг тоже идёт дальше.
// Порядок участников и «осталось ли» — те же, что в боте (server workout/superset-round.ts)

export { type ExerciseBlock, supersetLabels, supersetLetter, toBlocks } from '@/shared/lib/superset'

const hasLeft = (item: WorkoutItem) => item.sets.length < item.plannedSets

export type SupersetRound = {
  superset: number
  letter: string
  /** Все участники суперсета по порядку */
  members: WorkoutItem[]
  /** Участники текущего круга: у кого остались подходы. Пропущенный в прошлом круге идёт в этом */
  round: WorkoutItem[]
  /** Круг, который сейчас делается, с 1 */
  number: number
  rounds: number
  /** Все подходы суперсета сделаны */
  done: boolean
}

/** Круг суперсета, в котором стоит упражнение; null — упражнение одиночное */
export const supersetRound = (items: WorkoutItem[], item: WorkoutItem): SupersetRound | null => {
  if (item.superset === null) return null
  const members = items.filter(e => e.superset === item.superset)
  const round = members.filter(hasLeft)
  const rounds = Math.max(...members.map(e => e.plannedSets), 1)
  return {
    superset: item.superset,
    letter: supersetLetter(item.superset),
    members,
    round,
    // По самому продвинутому участнику: после «не делал» у одного номер круга не откатывается назад
    number: round.length ? Math.max(...round.map(e => e.sets.length)) + 1 : rounds,
    rounds,
    done: round.length === 0,
  }
}

/** Доля сделанных подходов суперсета — заливка его дорожки */
export const supersetCharge = (members: WorkoutItem[]): number => {
  const planned = members.reduce((sum, e) => sum + e.plannedSets, 0)
  if (!planned) return 0
  return members.reduce((sum, e) => sum + Math.min(e.sets.length, e.plannedSets), 0) / planned
}

/** Суперсет закончится, если в круг запишутся подходы этих упражнений */
export const supersetDoneWith = (members: WorkoutItem[], addedIds: number[]): boolean =>
  members.every(e => e.sets.length + (addedIds.includes(e.id) ? 1 : 0) >= e.plannedSets)

/**
 * Что подставить в строку ввода круга: прошлый круг этой тренировки, иначе тот же подход прошлой тренировки,
 * иначе план — нижняя граница повторов: прибавить легче, чем убавить. Вес без истории не угадываем
 */
export const roundPrefill = (item: WorkoutItem): { weight: string; reps: string } => {
  const source = item.sets.at(-1) ?? lastSetHint(item.last, item.sets.length + 1)
  if (source) return { weight: source.weight === 0 ? '' : num(source.weight), reps: String(source.reps) }
  return { weight: '', reps: String(item.repsMin) }
}

/**
 * Текущее упражнение без явного выбора: первое несделанное, но начатый суперсет с оставшимися подходами
 * держит экран — иначе после первого круга его бы пропустило
 */
export const currentItem = (items: WorkoutItem[]): WorkoutItem | undefined => {
  for (const item of items) {
    if (item.superset === null) {
      if (!item.done) return item
      continue
    }
    const round = supersetRound(items, item)!
    // Суперсет проверяем один раз — на первом участнике
    if (round.members[0] !== item) continue
    if (round.round.length) return round.round[0]
  }
  return items[0]
}
