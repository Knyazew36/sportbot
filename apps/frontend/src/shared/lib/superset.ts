/** Буква суперсета: A, B… — номера в комплексе сервер держит 1..n сверху вниз */
export const supersetLetter = (superset: number): string => String.fromCharCode(64 + superset)

/** Подпись участника суперсета по порядку: «A1», «A2»…; null — одиночное упражнение */
export const supersetLabels = <T extends { superset?: number | null }>(items: T[]): (string | null)[] =>
  items.map((item, i) => {
    if (item.superset == null) return null
    const index = items.slice(0, i).filter(e => e.superset === item.superset).length
    return `${supersetLetter(item.superset)}${index + 1}`
  })
