/** Буква суперсета: A, B… — номера в комплексе сервер держит 1..n сверху вниз */
export const supersetLetter = (superset: number): string => String.fromCharCode(64 + superset)

/** Подпись участника суперсета по порядку: «A1», «A2»…; null — одиночное упражнение */
export const supersetLabels = <T extends { superset?: number | null }>(items: T[]): (string | null)[] =>
  items.map((item, i) => {
    if (item.superset == null) return null
    const index = items.slice(0, i).filter(e => e.superset === item.superset).length
    return `${supersetLetter(item.superset)}${index + 1}`
  })

/** Упражнение одиночное или суперсет: подряд идущие участники с одним номером */
export type ExerciseBlock<T> = {
  /** Ключ для React и перетаскивания: s<номер> у суперсета, e<id> у одиночного */
  key: string
  superset: number | null
  items: T[]
}

/** Плоский список упражнений → блоки по порядку */
export const toBlocks = <T extends { id: number; superset: number | null }>(items: T[]): ExerciseBlock<T>[] => {
  const blocks: ExerciseBlock<T>[] = []
  for (const item of items) {
    const last = blocks.at(-1)
    if (last && item.superset !== null && last.superset === item.superset) last.items.push(item)
    else blocks.push({ key: item.superset === null ? `e${item.id}` : `s${item.superset}`, superset: item.superset, items: [item] })
  }
  return blocks
}

/**
 * Суперсеты после правки порядка или состава — копия normalizeSupersets с бэка (server/src/program/superset.ts):
 * у номера остаётся самый длинный непрерывный отрезок, одиночки выходят из группы, номера идут 1..n сверху вниз.
 * Нужна, чтобы правка, которая ещё не ушла на сервер, выглядела ровно так, как её потом вернёт сервер
 */
export const normalizeSupersets = <T extends { id: number; superset: number | null }>(items: T[]): T[] => {
  const blocks = toBlocks(items)
  const longest = new Map<number, ExerciseBlock<T>>()
  for (const block of blocks) {
    if (block.superset === null) continue
    const best = longest.get(block.superset)
    if (!best || block.items.length > best.items.length) longest.set(block.superset, block)
  }
  let next = 0
  return blocks.flatMap(block => {
    const kept = block.superset !== null && block.items.length > 1 && longest.get(block.superset) === block
    const superset = kept ? ++next : null
    return block.items.map(item => (item.superset === superset ? item : { ...item, superset }))
  })
}
