import { supersetLetter } from '@/shared/lib/superset'

import type { WorkoutItem, WorkoutSet } from './api'

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
// Та же логика, что в боте (server workout/superset-round.ts): считаем по очереди, а не по серверу,
// иначе без сети круг не шёл бы дальше

export { supersetLabels, supersetLetter } from '@/shared/lib/superset'

export type RoundInfo = {
  letter: string
  /** Место упражнения в суперсете, с 1 */
  index: number
  size: number
  /** Круг, который сейчас делается, с 1 */
  round: number
  rounds: number
  /** Следующее упражнение круга; null — дальше снова это же или суперсет закончен */
  next: WorkoutItem | null
}

const hasLeft = (item: WorkoutItem) => item.sets.length < item.plannedSets

const membersOf = (items: WorkoutItem[], item: WorkoutItem) =>
  item.superset === null ? [item] : items.filter(e => e.superset === item.superset)

/** Следующий по кругу участник с оставшимися подходами, не считая текущего */
const nextMember = (members: WorkoutItem[], item: WorkoutItem) => {
  const index = members.indexOf(item)
  for (let step = 1; step < members.length; step++) {
    const next = members[(index + step) % members.length]!
    if (hasLeft(next)) return { next, wrapped: index + step >= members.length }
  }
  return null
}

/**
 * Куда идти после подхода, который сейчас записывается (в items его ещё нет). В суперсете — к следующему
 * участнику без отдыха, отдых только когда круг замкнулся. Одиночное остаётся на месте с отдыхом
 */
export const afterNewSet = (items: WorkoutItem[], itemId: number): { nextId: number; rest: boolean } => {
  // Вес и повторы для круга не важны — только сколько подходов уже есть
  const draft = (e: WorkoutItem): WorkoutSet => ({ id: 0, clientId: null, number: e.sets.length + 1, weight: 0, reps: 0 })
  const withSet = items.map(e => (e.id === itemId ? { ...e, done: true, sets: [...e.sets, draft(e)] } : e))
  const item = withSet.find(e => e.id === itemId)
  if (!item || item.superset === null) return { nextId: itemId, rest: true }
  const members = membersOf(withSet, item)
  const found = nextMember(members, item)
  if (found) return { nextId: found.next.id, rest: found.wrapped }
  if (hasLeft(item)) return { nextId: itemId, rest: true }
  // Суперсет закончен — следующий несделанный блок, иначе остаёмся
  const after = withSet.indexOf(members.at(-1)!)
  const next = withSet.find((e, i) => i > after && !e.done) ?? withSet.find(e => !e.done)
  return { nextId: next?.id ?? itemId, rest: true }
}

/**
 * Текущее упражнение без явного выбора: первое несделанное, но начатый суперсет с оставшимися подходами
 * держит круг — иначе после первого подхода у всех участников его бы пропустило
 */
export const currentItem = (items: WorkoutItem[]): WorkoutItem | undefined => {
  for (const item of items) {
    if (item.superset === null) {
      if (!item.done) return item
      continue
    }
    const members = membersOf(items, item)
    // Суперсет проверяем один раз — на первом участнике
    if (members[0] !== item) continue
    const left = members.filter(hasLeft)
    if (left.length && members.some(e => e.sets.length > 0))
      return left.reduce((min, e) => (e.sets.length < min.sets.length ? e : min))
    const fresh = members.find(e => !e.done)
    if (fresh) return fresh
  }
  return items[0]
}

/** Подпись круга для экрана упражнения; null — упражнение не в суперсете */
export const roundInfo = (items: WorkoutItem[], item: WorkoutItem): RoundInfo | null => {
  if (item.superset === null) return null
  const members = membersOf(items, item)
  const rounds = Math.max(...members.map(e => e.plannedSets))
  return {
    letter: supersetLetter(item.superset),
    index: members.indexOf(item) + 1,
    size: members.length,
    round: Math.min(item.sets.length + 1, Math.max(rounds, 1)),
    rounds,
    next: nextMember(members, item)?.next ?? null,
  }
}
