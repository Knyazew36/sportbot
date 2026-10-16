import { EyeOffIcon, GlobeIcon, HourglassIcon, XIcon } from 'lucide-react'

import type { ProgramPublication, ProgramTagResponseDto } from '@/shared/api/generated/model'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { pluralize } from '@/shared/lib/format'
import type { StatusMeta } from '@/shared/ui/kit/StatusBadge'

import type { CatalogSource, ProgramTagGroup } from './api'

export type ProgramTag = ProgramTagResponseDto

/** Выбор в рядах чипов: код группы → код тега; группы без выбора в объекте нет */
export type TagSelection = Record<string, string>

/** Параметр поиска в ссылке каталога; коды групп с ним не совпадают — сервер не даёт завести группу «q» */
export const SEARCH_PARAM = 'q'

/** Таб каталога в ссылке: страница программы берёт её из списка того же таба */
export const SOURCE_PARAM = 'source'

/** Страница программы каталога: программе пользователя — с табом, иначе её не найти среди шаблонов */
export const catalogItemPath = (id: number, source: CatalogSource): string => {
  const path = buildPath(ROUTES.PROGRAM_TEMPLATE, { templateId: id })
  return source === 'users' ? `${path}?${SOURCE_PARAM}=users` : path
}

/** «12 добавлений» — сколько раз программу взяли себе */
export const addedText = (count: number): string => pluralize(count, ['добавление', 'добавления', 'добавлений'])

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

/** Статус публикации программы в каталоге «Программы пользователей» — для автора */
export const PUBLICATION_STATUS: Record<ProgramPublication, StatusMeta> = {
  DRAFT: { tone: 'neutral', icon: EyeOffIcon, label: 'только у тебя' },
  PENDING: { tone: 'attention', icon: HourglassIcon, label: 'на проверке' },
  PUBLISHED: { tone: 'success', icon: GlobeIcon, label: 'в каталоге' },
  REJECTED: { tone: 'danger', icon: XIcon, label: 'не прошла проверку' },
}

/** Название тега для сравнения: регистр, ё и знаки не важны — как normalizeName на бэке */
export const normalizeTagName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/g, ' ')
    .trim()
