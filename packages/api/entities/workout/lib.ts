import { clockText, durationText, isTimed, type Measure, timeInput } from '../../lib/measure'
import { unitOf } from '../../lib/records'
import { supersetLetter, toBlocks } from '../../lib/superset'

import type { WorkoutItem } from './api'

const num = (value: number) => String(Number(value.toFixed(2)))

export { planText } from '../../lib/measure'

/**
 * Прошлый раз одной строкой: «60 × 8, 8, 7»; разный вес — «60×8, 55×10»; на время — «45 с, 50 с».
 * null — истории нет
 */
export const lastText = (
  last: { date?: string; sets: { weight: number; reps: number }[] } | null | undefined,
  measure: Measure = 'REPS',
): string | null => {
  if (!last?.sets.length) return null
  if (isTimed(measure)) return last.sets.map(s => durationText(s.reps)).join(', ')
  const weights = new Set(last.sets.map(s => s.weight))
  const w = (value: number) => (value === 0 ? 'свой вес' : num(value))
  if (weights.size === 1) return `${w(last.sets[0]!.weight)} × ${last.sets.map(s => s.reps).join(', ')}`
  return last.sets.map(s => `${w(s.weight)}×${s.reps}`).join(', ')
}

/** Подсказка к полю подхода: значение того же подхода в прошлый раз */
export const lastSetHint = (last: WorkoutItem['last'], number: number) => last?.sets[number - 1]

export const weightText = (weight: number) => (weight === 0 ? 'свой' : num(weight))

/** Один подход прошлого раза: «60 × 8», «свой вес × 12», «45 с» */
export const lastSetText = (set: { weight: number; reps: number }, measure: Measure = 'REPS') =>
  isTimed(measure) ? durationText(set.reps) : `${set.weight === 0 ? 'свой вес' : num(set.weight)} × ${set.reps}`

/**
 * Обычный отдых между подходами: медиана, а не среднее — одна долгая пауза у телефона его не раздувает.
 * null — отдых не засекался (ручной ввод, бот, один подход)
 */
export const typicalRest = (sets: { restBeforeSeconds?: number | null }[]): number | null => {
  const rests = sets
    .map(s => s.restBeforeSeconds)
    .filter((r): r is number => r != null)
    .sort((a, b) => a - b)
  if (!rests.length) return null
  const mid = Math.floor(rests.length / 2)
  return rests.length % 2 ? rests[mid]! : Math.round((rests[mid - 1]! + rests[mid]!) / 2)
}

/** Единица истории упражнения — как у статистики: по прошлому разу, а без него по сегодняшним подходам */
export const historyUnit = (item: Pick<WorkoutItem, 'last' | 'sets' | 'measure'>) =>
  unitOf(item.last?.sets ?? item.sets, item.measure)

/** Отдых строкой: «1:30» */
export const restText = (seconds: number) => clockText(seconds)

// ── Суперсет ────────────────────────────────────────────────────────────────
// Круг считаем по очереди подходов, а не по серверу: без сети круг тоже идёт дальше.
// Порядок участников и «осталось ли» — те же, что в боте (server workout/superset-round.ts)

export { type ExerciseBlock, supersetLabels, supersetLetter, toBlocks } from '../../lib/superset'

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
  // У упражнения на время в reps секунды — в поле по мере: секунды или минуты
  const reps = (value: number) => (isTimed(item.measure) ? timeInput(item.measure, value) : String(value))
  const source = item.sets.at(-1) ?? lastSetHint(item.last, item.sets.length + 1)
  if (source) return { weight: source.weight === 0 ? '' : num(source.weight), reps: reps(source.reps) }
  return { weight: '', reps: reps(item.repsMin) }
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

// ── Фактический порядок ─────────────────────────────────────────────────────

/**
 * Упражнения в том порядке, в каком их делали: блок (одиночное или суперсет целиком) встаёт по первому подходу.
 * Блоки без времени подходов (не делал, отмечено без подходов, старые записи) — в конце, в порядке плана.
 * reordered — порядок разошёлся с планом, это стоит подписать
 */
export const doneOrder = <T extends { id: number; superset: number | null; sets: { doneAt: string | null }[] }>(
  items: T[],
): { items: T[]; reordered: boolean } => {
  const blocks = toBlocks(items).map(block => {
    const times = block.items.flatMap(e => e.sets.flatMap(s => (s.doneAt ? [Date.parse(s.doneAt)] : [])))
    return { block, start: times.length ? Math.min(...times) : Infinity }
  })
  // sort стабильный: блоки без времени и с одинаковым временем остаются в порядке плана
  const sorted = [...blocks].sort((a, b) => (a.start === b.start ? 0 : a.start < b.start ? -1 : 1))
  return {
    items: sorted.flatMap(b => b.block.items),
    reordered: sorted.some((b, i) => b !== blocks[i]),
  }
}
