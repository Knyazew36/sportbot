import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { catalogKeys } from '@/entities/catalog'
import {
  adminCatalogControllerCreateExercise,
  adminCatalogControllerCreateStretch,
  adminCatalogControllerExercise,
  adminCatalogControllerExercises,
  adminCatalogControllerImage,
  adminCatalogControllerPublishExercise,
  adminCatalogControllerPublishStretch,
  adminCatalogControllerRemoveExercise,
  adminCatalogControllerRemoveStretch,
  adminCatalogControllerStretch,
  adminCatalogControllerStretches,
  adminCatalogControllerUnpublishExercise,
  adminCatalogControllerUnpublishStretch,
  adminCatalogControllerUpdateExercise,
  adminCatalogControllerUpdateStretch,
} from '@/shared/api/generated/admin-catalog/admin-catalog'
import type {
  AdminCatalogItemResponseDto,
  AdminCatalogQueryDto,
  AdminExerciseResponseDto,
  AdminStretchResponseDto,
  SaveExerciseDto,
  SaveStretchDto,
} from '@/shared/api/generated/model'

export type AdminCatalogItem = AdminCatalogItemResponseDto
export type AdminExercise = AdminExerciseResponseDto
export type AdminStretch = AdminStretchResponseDto
export type AdminCatalogKind = 'exercise' | 'stretch'
export type AdminCatalogFilter = Pick<
  AdminCatalogQueryDto,
  'search' | 'filter_noImage' | 'filter_noMuscles' | 'filter_status' | 'filter_userMade'
>

const PAGE_SIZE = 30

export const adminCatalogKeys = {
  all: ['admin-catalog'] as const,
  list: (kind: AdminCatalogKind, filter: AdminCatalogFilter) => ['admin-catalog', kind, 'list', filter] as const,
  exercise: (id: number) => ['admin-catalog', 'exercise', id] as const,
  stretch: (id: number) => ['admin-catalog', 'stretch', id] as const,
}

/** Справочник админа: все записи, фильтры «без картинки», «без мышц», статус и «от пользователей» (frontend-tz, 14.1) */
export const useAdminCatalog = (kind: AdminCatalogKind, filter: AdminCatalogFilter) =>
  useInfiniteQuery({
    queryKey: adminCatalogKeys.list(kind, filter),
    queryFn: ({ pageParam }) => {
      const params = { ...filter, page: pageParam, limit: PAGE_SIZE }
      return kind === 'exercise' ? adminCatalogControllerExercises(params) : adminCatalogControllerStretches(params)
    },
    initialPageParam: 1,
    getNextPageParam: (last: { meta?: { page: number; hasNextPage: boolean } }) =>
      last.meta?.hasNextPage ? last.meta.page + 1 : undefined,
    placeholderData: keepPreviousData,
  })

export const useAdminExercise = (id: number | null) =>
  useQuery({
    queryKey: adminCatalogKeys.exercise(id ?? 0),
    queryFn: () => adminCatalogControllerExercise(id!),
    enabled: id != null,
  })

export const useAdminStretch = (id: number | null) =>
  useQuery({
    queryKey: adminCatalogKeys.stretch(id ?? 0),
    queryFn: () => adminCatalogControllerStretch(id!),
    enabled: id != null,
  })

// Правка справочника видна пользователям сразу: их выдачу тоже перечитываем
const useInvalidateCatalog = () => {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminCatalogKeys.all })
    void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
  }
}

export const useSaveExercise = () => {
  const invalidate = useInvalidateCatalog()
  return useMutation({
    mutationFn: ({ id, ...body }: SaveExerciseDto & { id: number | null }) =>
      id == null ? adminCatalogControllerCreateExercise(body) : adminCatalogControllerUpdateExercise(id, body),
    meta: { successMessage: 'Упражнение сохранено', inlineFieldErrors: true },
    onSuccess: invalidate,
  })
}

export const useSaveStretch = () => {
  const invalidate = useInvalidateCatalog()
  return useMutation({
    mutationFn: ({ id, ...body }: SaveStretchDto & { id: number | null }) =>
      id == null ? adminCatalogControllerCreateStretch(body) : adminCatalogControllerUpdateStretch(id, body),
    meta: { successMessage: 'Растяжка сохранена', inlineFieldErrors: true },
    onSuccess: invalidate,
  })
}

export const useDeleteCatalogItem = () => {
  const invalidate = useInvalidateCatalog()
  return useMutation({
    mutationFn: ({ kind, id }: { kind: AdminCatalogKind; id: number }) =>
      kind === 'exercise' ? adminCatalogControllerRemoveExercise(id) : adminCatalogControllerRemoveStretch(id),
    meta: { successMessage: 'Запись удалена' },
    onSuccess: invalidate,
  })
}

/** Снять с публикации: запись пропадает из общего справочника, у автора остаётся личной */
export const useUnpublishCatalogItem = () => {
  const invalidate = useInvalidateCatalog()
  return useMutation({
    mutationFn: ({ kind, id }: { kind: AdminCatalogKind; id: number }) =>
      kind === 'exercise' ? adminCatalogControllerUnpublishExercise(id) : adminCatalogControllerUnpublishStretch(id),
    meta: { successMessage: 'Снято с публикации' },
    onSuccess: invalidate,
  })
}

/** Вернуть в справочник без заявки */
export const usePublishCatalogItem = () => {
  const invalidate = useInvalidateCatalog()
  return useMutation({
    mutationFn: ({ kind, id }: { kind: AdminCatalogKind; id: number }) =>
      kind === 'exercise' ? adminCatalogControllerPublishExercise(id) : adminCatalogControllerPublishStretch(id),
    meta: { successMessage: 'Возвращено в справочник' },
    onSuccess: invalidate,
  })
}

/** Загрузка картинки записи: путь потом уходит в форму записи или в одобрение заявки */
export const useUploadCatalogImage = () =>
  useMutation({
    mutationFn: (file: File) => adminCatalogControllerImage({ file }),
    // Картинка сразу появляется в превью формы
    meta: { skipSuccessToast: true },
  })
