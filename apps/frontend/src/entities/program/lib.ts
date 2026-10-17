import { EyeOffIcon, GlobeIcon, HourglassIcon, XIcon } from 'lucide-react'

import type { ProgramPublication, ProgramTagResponseDto } from '@/shared/api/generated/model'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { pluralize } from '@front-cmdt/utils/pluralize'
import type { StatusMeta } from '@/shared/ui/kit/StatusBadge'

import type { CatalogSource, Program, ProgramTagGroup } from './api'

export { type ExerciseBlock, supersetLabels, supersetLetter, toBlocks } from '@/shared/lib/superset'

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

/** Куда добавить выбранные упражнения: к суперсету упражнения или новым суперсетом */
export type SupersetTarget = { joinItemId?: number; newSuperset?: boolean }

const JOIN_PARAM = 'join'
const NEW_SUPERSET_PARAM = 'superset'

/** Ссылка на подбор упражнений с целью-суперсетом; без цели — обычное добавление в конец */
export const withSupersetTarget = (path: string, target?: SupersetTarget): string => {
  if (target?.joinItemId) return `${path}?${JOIN_PARAM}=${target.joinItemId}`
  if (target?.newSuperset) return `${path}?${NEW_SUPERSET_PARAM}=new`
  return path
}

export const supersetTargetFromParams = (params: URLSearchParams): SupersetTarget => {
  const join = Number(params.get(JOIN_PARAM))
  if (join) return { joinItemId: join }
  return params.get(NEW_SUPERSET_PARAM) === 'new' ? { newSuperset: true } : {}
}

export { planText } from '@/shared/lib/measure'

/**
 * Статус публикации программы в каталоге «Программы пользователей» — для автора. Жёлтый — цвет «видят другие»,
 * как у кнопки публикации; на проверке программа ещё не наружу — без цвета
 */
export const PUBLICATION_STATUS: Record<ProgramPublication, StatusMeta> = {
  DRAFT: { tone: 'neutral', icon: EyeOffIcon, label: 'только у тебя' },
  PENDING: { tone: 'outline', icon: HourglassIcon, label: 'на проверке' },
  PUBLISHED: { tone: 'attention', icon: GlobeIcon, label: 'в каталоге' },
  REJECTED: { tone: 'danger', icon: XIcon, label: 'не прошла проверку' },
}

/** Опубликовать можно только свою программу: копию шаблона или чужой каталог превратил бы в клоны */
export const isPublishable = (p: Pick<Program, 'fromFriend' | 'fromTemplate'>): boolean =>
  !p.fromFriend && !p.fromTemplate

/** Подпись кнопки публикации по статусу */
export const publishLabel = (publication: ProgramPublication): string =>
  publication === 'DRAFT' ? 'Опубликовать' : publication === 'REJECTED' ? 'Исправить и отправить' : 'Описание и теги'

/** Название тега для сравнения: регистр, ё и знаки не важны — как normalizeName на бэке */
export const normalizeTagName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/g, ' ')
    .trim()
