import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

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
} from '@sportbot/api/entities/program';

import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value';

import { byPopularity } from './by-popularity';

export type CatalogSort = 'default' | 'popular';

/**
 * Фильтры каталога живут в параметрах экрана, как в ссылке фронта: экран шаблона возвращает
 * к той же выборке. Теги, источник (чьи), сортировка и поиск; без фильтров каталог показывает витрину полок
 */
export const useCatalogFilter = () => {
  const groups = useTemplateTagGroups();
  const params = useLocalSearchParams<Record<string, string>>();
  const sourceParam = params[SOURCE_PARAM];
  const scope: CatalogScope = sourceParam === 'users' || sourceParam === 'templates' ? sourceParam : 'all';
  const sort: CatalogSort = params[SORT_PARAM] === 'popular' ? 'popular' : 'default';
  const selection = selectionFromParams(groups.data ?? [], new URLSearchParams(params));
  const [query, setQuery] = useState(params[SEARCH_PARAM] ?? '');
  const search = useDebouncedValue(query.trim());
  const filtered = Object.keys(selection).length > 0 || search !== '' || scope !== 'all' || sort !== 'default';
  const catalog = useCatalog({ scope, tagIds: selectedTagIds(groups.data ?? [], selection), search });
  const merged = catalog.data ? [...catalog.data.templates, ...catalog.data.users] : [];
  const list = sort === 'popular' ? byPopularity(merged) : merged;

  // Поиск попадает в параметры после паузы, как и в запрос
  useEffect(() => {
    router.setParams({ [SEARCH_PARAM]: search || undefined });
  }, [search]);

  // Теги заменяются целиком: группы без выбора стираем, источник, сортировка и поиск остаются
  const select = (next: TagSelection) =>
    router.setParams(Object.fromEntries((groups.data ?? []).map((g) => [g.code, next[g.code] || undefined])));

  const reset = () => {
    setQuery('');
    router.setParams(Object.fromEntries(Object.keys(params).map((key) => [key, undefined])));
  };

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
    setScope: (value: CatalogScope) => router.setParams({ [SOURCE_PARAM]: value === 'all' ? undefined : value }),
    setSort: (value: CatalogSort) => router.setParams({ [SORT_PARAM]: value === 'default' ? undefined : value }),
  };
};

export type CatalogFilter = ReturnType<typeof useCatalogFilter>;
