import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  catalogControllerExercise,
  catalogControllerExercises,
  catalogControllerImage,
  catalogControllerJoints,
  catalogControllerMuscles,
  catalogControllerProposeExercise,
  catalogControllerProposeStretch,
  catalogControllerSimilar,
  catalogControllerStretch,
  catalogControllerStretches,
} from '../../generated/catalog/catalog'
import {
  draftControllerCreate,
  draftControllerMine,
  draftControllerPublishExercise,
  draftControllerPublishStretch,
} from '../../generated/drafts/drafts'
import type {
  CatalogControllerExercisesParams,
  CatalogExerciseResponseDto,
  CatalogListItemResponseDto,
  CatalogRefResponseDto,
  CatalogStretchResponseDto,
  CreateDraftDto,
  CreateExerciseProposalDto,
  CreateStretchProposalDto,
  MyEntryResponseDto,
} from '../../generated/model'

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
  mine: (kind: CatalogKind) => ['drafts', 'mine', kind] as const,
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

// ── Правки ──────────────────────────────────────────────────────────────────

/** Картинка своей записи или правки: файл сразу уходит на сервер, в форму попадает только его путь */
export const useUploadEntryImage = () =>
  useMutation({
    mutationFn: (file: File) => catalogControllerImage({ file }),
    // Картинка сразу появляется в превью формы
    meta: { skipSuccessToast: true },
  })

/** «Предложить правку»: изменённые поля упражнения уходят администратору на модерацию */
export const useProposeExercise = () =>
  useMutation({
    mutationFn: (body: CreateExerciseProposalDto) => catalogControllerProposeExercise(body),
    // Итог показывает сама шторка правки экраном «Спасибо!» — тост бы его дублировал
    meta: { skipSuccessToast: true, inlineFieldErrors: true },
  })

/** «Предложить правку» растяжки — так же, как упражнения */
export const useProposeStretch = () =>
  useMutation({
    mutationFn: (body: CreateStretchProposalDto) => catalogControllerProposeStretch(body),
    // Итог показывает сама шторка правки экраном «Спасибо!» — тост бы его дублировал
    meta: { skipSuccessToast: true, inlineFieldErrors: true },
  })

// ── Свои записи ─────────────────────────────────────────────────────────────

/** Вкладка «Мои»: свои записи одного вида и статус публикации */
export const useMyEntries = (kind: CatalogKind) =>
  useInfiniteQuery({
    queryKey: draftKeys.mine(kind),
    queryFn: ({ pageParam }) => draftControllerMine({ filter_kind: kind, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    // Исход заявки мог прийти, пока приложение было свёрнуто
    staleTime: 0,
  })

/** Сколько своих записей: упражнения и растяжки вместе — счётчик на кнопке «Мои» */
export const useMyEntriesCount = () =>
  useQuery({
    queryKey: [...draftKeys.all, 'count'] as const,
    queryFn: async () => {
      const [exercises, stretches] = await Promise.all(
        (['exercise', 'stretch'] as const).map(kind => draftControllerMine({ filter_kind: kind, limit: 1 })),
      )
      return (exercises?.meta?.total ?? 0) + (stretches?.meta?.total ?? 0)
    },
  })

export const useCreateDraft = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateDraftDto) => draftControllerCreate(body),
    // Итог показывает шторка создания экраном «Сохранено» — тост бы его дублировал
    meta: { skipSuccessToast: true, inlineFieldErrors: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: draftKeys.all })
      // Черновик сразу виден в выдаче справочника с пометкой «не проверено»
      void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
    },
  })
}

/** «Опубликовать»: своя запись уходит администратору на проверку в общий справочник */
export const usePublishEntry = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ kind, id }: { kind: CatalogKind; id: number }) =>
      kind === 'exercise' ? draftControllerPublishExercise(id) : draftControllerPublishStretch(id),
    meta: { successMessage: 'Отправлено на проверку' },
    onSuccess: (_, { kind, id }) => {
      void queryClient.invalidateQueries({ queryKey: draftKeys.all })
      void queryClient.invalidateQueries({
        queryKey: kind === 'exercise' ? catalogKeys.exercise(id) : catalogKeys.stretch(id),
      })
    },
  })
}
