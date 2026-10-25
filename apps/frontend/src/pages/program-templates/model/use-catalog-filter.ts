import { useSearchParams } from 'react-router'

import { useEffect, useState } from 'react'

import {
  type CatalogScope,
  SEARCH_PARAM,
  selectedTagIds,
  selectionFromParams,
  SORT_PARAM,
  SOURCE_PARAM,
  type TagSelection,
  useCatalog,
  useTemplateTagGroups,
} from '@sportbot/api/entities/program'
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value'

import { byPopularity } from '../components/CatalogShowcase'

export type CatalogSort = 'default' | 'popular'

/**
 * Фильтры каталога живут в ссылке: выборку можно переслать и вернуть кнопкой «назад».
 * Теги, источник (чьи), сортировка и поиск; без фильтров каталог показывает витрину полок
 */
export const useCatalogFilter = () => {
  const groups = useTemplateTagGroups()
  const [params, setParams] = useSearchParams()
  const sourceParam = params.get(SOURCE_PARAM)
  const scope: CatalogScope = sourceParam === 'users' || sourceParam === 'templates' ? sourceParam : 'all'
  const sort: CatalogSort = params.get(SORT_PARAM) === 'popular' ? 'popular' : 'default'
  const selection = selectionFromParams(groups.data ?? [], params)
  const [query, setQuery] = useState(params.get(SEARCH_PARAM) ?? '')
  const search = useDebouncedValue(query.trim())
  const filtered = Object.keys(selection).length > 0 || search !== '' || scope !== 'all' || sort !== 'default'
  const catalog = useCatalog({ scope, tagIds: selectedTagIds(groups.data ?? [], selection), search })
  const merged = catalog.data ? [...catalog.data.templates, ...catalog.data.users] : []
  const list = sort === 'popular' ? byPopularity(merged) : merged

  // Поиск попадает в ссылку после паузы, как и в запрос — история не копит каждую букву
  useEffect(() => {
    setParams(
      prev => {
        const next = new URLSearchParams(prev)
        if (search) next.set(SEARCH_PARAM, search)
        else next.delete(SEARCH_PARAM)
        return next
      },
      { replace: true },
    )
  }, [search, setParams])

  const setParam = (key: string, value: string | null) =>
    setParams(
      prev => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  // Теги заменяются целиком, источник, сортировка и поиск остаются
  const select = (next: TagSelection) =>
    setParams(
      prev => {
        const kept = new URLSearchParams(next)
        for (const key of [SEARCH_PARAM, SOURCE_PARAM, SORT_PARAM]) {
          const value = prev.get(key)
          if (value) kept.set(key, value)
        }
        return kept
      },
      { replace: true },
    )

  const reset = () => {
    setQuery('')
    setParams({}, { replace: true })
  }

  return {
    groups: groups.data ?? [],
    catalog,
    merged,
    list,
    scope,
    sort,
    selection,
    query,
    setQuery,
    filtered,
    /** Сколько фильтров включено в «Ещё» */
    moreActive: (scope !== 'all' ? 1 : 0) + (sort !== 'default' ? 1 : 0),
    select,
    reset,
    setScope: (value: CatalogScope) => setParam(SOURCE_PARAM, value === 'all' ? null : value),
    setSort: (value: CatalogSort) => setParam(SORT_PARAM, value === 'default' ? null : value),
  }
}

export type CatalogFilter = ReturnType<typeof useCatalogFilter>
