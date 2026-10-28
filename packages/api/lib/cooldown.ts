// Набор растяжек заминки без сервера — порт server workout/cooldown.service.ts (раздел 25.7 ТЗ).
// Чистые функции: кандидатов, прошлую заминку и случайность передаёт вызывающий
import type { MuscleRole, StretchPosition } from '../generated/model'

/**
 * Бюджет заминки: статика по 30 с на мышцу, всего 5–10 минут.
 * Основной блок — от 5 до 7 минут, «если есть время» — ещё до 3
 */
const MAIN_BUDGET_SECONDS = 7 * 60
/** Короче 5 минут основной блок не бывает: добирается второй растяжкой на те же мышцы */
const MAIN_MIN_SECONDS = 5 * 60
const OPTIONAL_BUDGET_SECONDS = 3 * 60
/** Перейти в новое положение и найти опору */
const TRANSITION_SECONDS = 10

/** Стоя → на коленях → сидя → лёжа: без лишних «встал-лёг-встал». Без положения — в конец */
const POSITION_ORDER: Record<StretchPosition, number> = { STANDING: 0, KNEELING: 1, SITTING: 2, LYING: 3 }

export type CooldownMuscle = { id: number; bodyOrder: number }

export type CooldownCandidate = {
  id: number
  position: StretchPosition | null
  holdSeconds: number
  perSide: boolean
  hasImage: boolean
  muscles: CooldownMuscle[]
}

export type CooldownExercise = {
  plannedSets: number
  muscles: { role: MuscleRole; muscle: CooldownMuscle }[]
}

const minOrder = (s: CooldownCandidate) => Math.min(...s.muscles.map(m => m.bodyOrder))
const positionOrder = (s: CooldownCandidate) => (s.position ? POSITION_ORDER[s.position] : 4)
const byFlow = (a: CooldownCandidate, b: CooldownCandidate) =>
  positionOrder(a) - positionOrder(b) || minOrder(a) - minOrder(b)

export const stretchSeconds = (s: { holdSeconds: number; perSide: boolean }) => s.holdSeconds * (s.perSide ? 2 : 1)

/** Мышцы роли по объёму тренировки (сумма подходов), при равенстве — сверху вниз по телу */
const rankMuscles = (exercises: CooldownExercise[], role: MuscleRole): CooldownMuscle[] => {
  const volume = new Map<number, { muscle: CooldownMuscle; sets: number }>()
  for (const item of exercises)
    for (const m of item.muscles) {
      if (m.role !== role) continue
      const entry = volume.get(m.muscle.id) ?? { muscle: m.muscle, sets: 0 }
      entry.sets += item.plannedSets
      volume.set(m.muscle.id, entry)
    }
  return [...volume.values()]
    .sort((a, b) => b.sets - a.sets || a.muscle.bodyOrder - b.muscle.bodyOrder)
    .map(v => v.muscle)
}

/** Заминка под тренировку: основной блок и «если есть время» */
export const buildCooldown = <C extends CooldownCandidate>(input: {
  exercises: CooldownExercise[]
  /** Можно предложить: заминочные, видимые, не исключённые */
  candidates: C[]
  /** Растяжки прошлой заминки — в конец очереди, чтобы набор не повторялся */
  recent: Set<number>
  random?: () => number
}): { main: C[]; optional: C[] } => {
  const { exercises, candidates, recent, random = Math.random } = input
  const primary = rankMuscles(exercises, 'PRIMARY')
  const primaryIds = new Set(primary.map(m => m.id))
  const secondary = rankMuscles(exercises, 'SECONDARY').filter(m => !primaryIds.has(m.id))

  const covered = new Set<number>()
  const chosen = new Set<number>()
  const pick = (wanted: CooldownMuscle[], budget: number, minimum = 0, spare: CooldownMuscle[] = []): C[] => {
    const picked: C[] = []
    const wantedIds = new Set(wanted.map(m => m.id))
    let spent = 0
    // Добавить растяжку на мышцу; again — мышца уже закрыта, это добор времени
    const take = (muscle: CooldownMuscle, again: boolean) => {
      const options = candidates.filter(s => !chosen.has(s.id) && s.muscles.some(m => m.id === muscle.id))
      if (!options.length) return false
      const score = (s: C) =>
        s.muscles.filter(m => wantedIds.has(m.id) && (again || !covered.has(m.id))).length * 2 +
        (s.hasImage ? 1 : 0) +
        (recent.has(s.id) ? 0 : 2)
      const best = Math.max(...options.map(score))
      const top = options.filter(s => score(s) === best)
      const stretch = top[Math.floor(random() * top.length)]!
      const cost = stretchSeconds(stretch) + TRANSITION_SECONDS
      // Первая растяжка блока берётся всегда, дальше — пока укладываемся во время
      if (picked.length && spent + cost > budget) return false
      spent += cost
      chosen.add(stretch.id)
      for (const m of stretch.muscles) covered.add(m.id)
      picked.push(stretch)
      return true
    }

    // Растяжка, взятая раньше, уже закрыла эту мышцу — вторая на неё сразу не добавляется
    for (const muscle of wanted) if (!covered.has(muscle.id)) take(muscle, false)

    // Мало мышц — заминка вышла бы на 2 минуты. Добираем по кругу: сначала самые нагруженные
    const pool = [...wanted, ...spare]
    while (spent < minimum) {
      let added = false
      for (const muscle of pool) {
        if (spent >= minimum) break
        added = take(muscle, true) || added
      }
      if (!added) break
    }
    return picked.sort(byFlow)
  }

  const main = pick(primary, MAIN_BUDGET_SECONDS, MAIN_MIN_SECONDS, secondary)
  const optional = pick(secondary, OPTIONAL_BUDGET_SECONDS)
  return { main, optional }
}

/**
 * Замена растяжки после «не предлагать»: лучше та, что закрывает больше мышц убранной,
 * та же поза — плюс. null — замены нет, растяжка просто убирается
 */
export const replacementFor = <C extends CooldownCandidate>(
  removed: CooldownCandidate,
  options: C[],
  random: () => number = Math.random,
): C | null => {
  const muscleIds = removed.muscles.map(m => m.id)
  const fitting = options.filter(s => s.muscles.some(m => muscleIds.includes(m.id)))
  const overlap = (s: C) =>
    s.muscles.filter(m => muscleIds.includes(m.id)).length * 2 + (s.position === removed.position ? 1 : 0)
  const best = Math.max(0, ...fitting.map(overlap))
  const top = fitting.filter(s => overlap(s) === best)
  return top[Math.floor(random() * top.length)] ?? null
}

/** Минуты блока, округлённые вверх */
export const cooldownMinutes = (stretches: { holdSeconds: number; perSide: boolean }[]) =>
  Math.ceil(stretches.reduce((sum, s) => sum + stretchSeconds(s), 0) / 60)
