import type { ProgramListItem } from '@sportbot/api/entities/program'

/** С какого числа программ в выборе появляется поиск */
export const SEARCH_FROM = 7

/** Куда копировать тренировку: активная программа первой, остальные — как в списке; поиск по названию */
export const sortTargets = (programs: ProgramListItem[], search = '') => {
  const query = search.trim().toLowerCase()
  return programs
    .filter(p => !query || p.name.toLowerCase().includes(query))
    .sort((a, b) => Number(b.active) - Number(a.active))
}
