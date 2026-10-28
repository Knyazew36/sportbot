import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import type { ExerciseFilter, StretchFilter } from '@sportbot/api/entities/catalog';
import {
  catalogControllerExercise,
  catalogControllerExercises,
  catalogControllerJoints,
  catalogControllerMuscles,
  catalogControllerStretch,
  catalogControllerStretches,
} from '@sportbot/api/generated/catalog/catalog';

import { useLocalDb } from '@/shared/db';

import { LOCAL_ROOT, useLocalQuery } from '../../local-query';
import {
  readExercise,
  readExercisePage,
  readJoints,
  readMuscles,
  readStretch,
  readStretchPage,
} from './read-catalog';

// Как PAGE_SIZE в пакете: страница выдачи та же, что у сервера
const PAGE_SIZE = 30;

const nextPage = (last: { meta?: { page: number; hasNextPage: boolean } }) =>
  last.meta?.hasNextPage ? last.meta.page + 1 : undefined;

/** Мышцы справочника сверху вниз по телу — кнопки фильтра */
export const useMuscles = () =>
  useLocalQuery({ key: ['catalog', 'muscles'], read: readMuscles, fallback: () => catalogControllerMuscles() });

/** Суставы — зоны ограничений */
export const useJoints = () =>
  useLocalQuery({ key: ['catalog', 'joints'], read: readJoints, fallback: () => catalogControllerJoints() });

/** Упражнения справочника и свои черновики, страницами — из базы, а до первого синка с сервера */
export const useCatalogExercises = (filter: ExerciseFilter) => {
  const db = useLocalDb();
  return useInfiniteQuery({
    queryKey: [LOCAL_ROOT, db ? 'db' : 'rest', 'catalog', 'exercises', filter],
    queryFn: async ({ pageParam }) =>
      (db && readExercisePage(db, filter, pageParam, PAGE_SIZE)) ??
      catalogControllerExercises({ ...filter, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    staleTime: Infinity,
    // Смена фильтра не мигает пустым списком
    placeholderData: keepPreviousData,
  });
};

export const useCatalogStretches = (filter: StretchFilter) => {
  const db = useLocalDb();
  return useInfiniteQuery({
    queryKey: [LOCAL_ROOT, db ? 'db' : 'rest', 'catalog', 'stretches', filter],
    queryFn: async ({ pageParam }) =>
      (db && readStretchPage(db, filter, pageParam, PAGE_SIZE)) ??
      catalogControllerStretches({ ...filter, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });
};

export const useCatalogExercise = (id: number) =>
  useLocalQuery({
    key: ['catalog', 'exercise', id],
    read: (db) => readExercise(db, id),
    fallback: () => catalogControllerExercise(id),
  });

export const useCatalogStretch = (id: number) =>
  useLocalQuery({
    key: ['catalog', 'stretch', id],
    read: (db) => readStretch(db, id),
    fallback: () => catalogControllerStretch(id),
  });
