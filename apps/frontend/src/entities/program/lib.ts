import type { ProgramTagResponseDto } from '@/shared/api/generated/model'

import type { ProgramTagGroup } from './api'

export type ProgramTag = ProgramTagResponseDto

/** Выбор в рядах чипов: код группы → код тега; группы без выбора в объекте нет */
export type TagSelection = Record<string, string>

/** Параметр поиска в ссылке каталога; коды групп с ним не совпадают — сервер не даёт завести группу «q» */
export const SEARCH_PARAM = 'q'

/** Выбор чипов из ссылки: параметр на группу. Тег из старой ссылки мог пропасть — тогда группа «все» */
export const selectionFromParams = (groups: ProgramTagGroup[], params: URLSearchParams): TagSelection => {
  const selection: TagSelection = {}
  for (const g of groups) {
    const code = params.get(g.code)
    if (code && g.tags.some(t => t.code === code)) selection[g.code] = code
  }
  return selection
}

/** Id выбранных тегов для запроса каталога, в порядке групп — ключ кэша не зависит от порядка кликов */
export const selectedTagIds = (groups: ProgramTagGroup[], selection: TagSelection): number[] =>
  groups.flatMap(g => g.tags.filter(t => selection[g.code] === t.code).map(t => t.id))

/** Буква комплекса по месту в очереди: A, B, C… */
export const complexLetter = (index: number): string => String.fromCharCode(65 + (index % 26))

/** План подходов: «3 × 8–12» или «3 × 10» */
export const planText = (sets: number, repsMin: number, repsMax: number): string =>
  `${sets} × ${repsMin === repsMax ? repsMin : `${repsMin}–${repsMax}`}`
