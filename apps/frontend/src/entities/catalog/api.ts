import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  catalogControllerComplain,
  catalogControllerExercise,
  catalogControllerExercises,
  catalogControllerJoints,
  catalogControllerMuscles,
  catalogControllerSimilar,
  catalogControllerStretch,
  catalogControllerStretches,
} from '@/shared/api/generated/catalog/catalog'
import { draftControllerCreate, draftControllerLimit, draftControllerMine } from '@/shared/api/generated/drafts/drafts'
import type {
  CatalogControllerExercisesParams,
  CatalogExerciseResponseDto,
  CatalogListItemResponseDto,
  CatalogRefResponseDto,
  CatalogStretchResponseDto,
  CreateComplaintDto,
  CreateDraftDto,
  MyEntryResponseDto,
} from '@/shared/api/generated/model'

export type CatalogListItem = CatalogListItemResponseDto
export type CatalogRef = CatalogRefResponseDto
export type CatalogExercise = CatalogExerciseResponseDto
export type CatalogStretch = CatalogStretchResponseDto
export type MyEntry = MyEntryResponseDto
export type CatalogKind = 'exercise' | 'stretch'
export type ExerciseFilter = Pick<CatalogControllerExercisesParams, 'search' | 'filter_muscle' | 'filter_equipment'>
export type StretchFilter = Pick<CatalogControllerExercisesParams, 'search' | 'filter_muscle'>

const PAGE_SIZE = 30

export const catalogKeys = {
  all: ['catalog'] as const,
  muscles: ['catalog', 'muscles'] as const,
  joints: ['catalog', 'joints'] as const,
  exercises: (filter: ExerciseFilter) => ['catalog', 'exercises', filter] as const,
  stretches: (filter: StretchFilter) => ['catalog', 'stretches', filter] as const,
  exercise: (id: number) => ['catalog', 'exercise', id] as const,
  stretch: (id: number) => ['catalog', 'stretch', id] as const,
  similar: (kind: CatalogKind, name: string) => ['catalog', 'similar', kind, name] as const,
}

export const draftKeys = {
  all: ['drafts'] as const,
  limit: ['drafts', 'limit'] as const,
  mine: ['drafts', 'mine'] as const,
}

// Страница с бэка: { items, meta } — следующая есть, пока hasNextPage
const nextPage = (last: { meta?: { page: number; hasNextPage: boolean } }) =>
  last.meta?.hasNextPage ? last.meta.page + 1 : undefined

/** 16 мышц справочника сверху вниз по телу — кнопки фильтра */
export const useMuscles = () =>
  useQuery({
    queryKey: catalogKeys.muscles,
    queryFn: () => catalogControllerMuscles(),
    staleTime: Infinity,
  })

/** 8 суставов — зоны ограничений */
export const useJoints = () =>
  useQuery({
    queryKey: catalogKeys.joints,
    queryFn: () => catalogControllerJoints(),
    staleTime: Infinity,
  })

/** Упражнения справочника и свои черновики, страницами по мере прокрутки */
export const useCatalogExercises = (filter: ExerciseFilter) =>
  useInfiniteQuery({
    queryKey: catalogKeys.exercises(filter),
    queryFn: ({ pageParam }) => catalogControllerExercises({ ...filter, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    // Смена фильтра не мигает пустым списком
    placeholderData: keepPreviousData,
  })

export const useCatalogStretches = (filter: StretchFilter) =>
  useInfiniteQuery({
    queryKey: catalogKeys.stretches(filter),
    queryFn: ({ pageParam }) => catalogControllerStretches({ ...filter, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    placeholderData: keepPreviousData,
  })

export const useCatalogExercise = (id: number) =>
  useQuery({
    queryKey: catalogKeys.exercise(id),
    queryFn: () => catalogControllerExercise(id),
  })

export const useCatalogStretch = (id: number) =>
  useQuery({
    queryKey: catalogKeys.stretch(id),
    queryFn: () => catalogControllerStretch(id),
  })

/** «Возможно, ты искал…»: похожие записи справочника по введённому названию */
export const useSimilar = (kind: CatalogKind, name: string) =>
  useQuery({
    queryKey: catalogKeys.similar(kind, name),
    queryFn: () => catalogControllerSimilar({ kind, name }),
    // Короткое название ничего осмысленного не найдёт
    enabled: name.length >= 3,
    placeholderData: keepPreviousData,
  })

/** «Ошибка в описании» — жалоба уходит администратору */
export const useComplain = () =>
  useMutation({
    mutationFn: (body: CreateComplaintDto) => catalogControllerComplain(body),
    meta: { successMessage: 'Жалоба у администратора', inlineFieldErrors: true },
  })

// ── Свои записи ─────────────────────────────────────────────────────────────

/** Сколько заявок осталось на сегодня: при нуле мастер не открывается */
export const useDraftLimit = () =>
  useQuery({
    queryKey: draftKeys.limit,
    queryFn: () => draftControllerLimit(),
    staleTime: 0,
  })

/** Вкладка «Мои»: свои записи и исход модерации */
export const useMyEntries = () =>
  useInfiniteQuery({
    queryKey: draftKeys.mine,
    queryFn: ({ pageParam }) => draftControllerMine({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    // Исход заявки мог прийти, пока приложение было свёрнуто
    staleTime: 0,
  })

export const useCreateDraft = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateDraftDto) => draftControllerCreate(body),
    meta: { successMessage: 'Черновик создан, заявка у администратора', inlineFieldErrors: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: draftKeys.all })
      // Черновик сразу виден в выдаче справочника с пометкой «не проверено»
      void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
    },
  })
}
