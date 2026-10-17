import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { programKeys } from '@/entities/program'
import {
  adminProgramReviewControllerApprove,
  adminProgramReviewControllerApproveTag,
  adminProgramReviewControllerList,
  adminProgramReviewControllerOne,
  adminProgramReviewControllerReject,
  adminProgramReviewControllerRejectTag,
  adminProgramReviewControllerRemove,
  adminProgramReviewControllerReplaceTag,
  adminProgramReviewControllerTakeDown,
} from '@/shared/api/generated/admin-program-reviews/admin-program-reviews'
import type {
  ProgramReviewFilter,
  ProgramReviewListItemResponseDto,
  ProgramReviewResponseDto,
} from '@/shared/api/generated/model'

import { adminKeys, nextPage } from './api'

export type ProgramReview = ProgramReviewResponseDto
export type ProgramReviewListItem = ProgramReviewListItemResponseDto
export type { ProgramReviewFilter }

const PAGE_SIZE = 30

export const programReviewKeys = {
  all: ['admin', 'program-reviews'] as const,
  list: (filter: ProgramReviewFilter) => ['admin', 'program-reviews', 'list', filter] as const,
  detail: (id: number) => ['admin', 'program-reviews', 'detail', id] as const,
}

/** Программы пользователей: queue — ждут решения (публикации, правки текста, свои теги), published — в каталоге */
export const useProgramReviews = (filter: ProgramReviewFilter) =>
  useInfiniteQuery({
    queryKey: programReviewKeys.list(filter),
    queryFn: ({ pageParam }) =>
      adminProgramReviewControllerList({ page: pageParam, limit: PAGE_SIZE, filter_status: filter }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    staleTime: 0,
  })

export const useProgramReview = (id: number) =>
  useQuery({
    queryKey: programReviewKeys.detail(id),
    queryFn: () => adminProgramReviewControllerOne(id),
  })

// Решение меняет очередь, счётчик вкладки и каталог «Программы пользователей»
const useInvalidateReviews = () => {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: programReviewKeys.all })
    void queryClient.invalidateQueries({ queryKey: adminKeys.counters })
    void queryClient.invalidateQueries({ queryKey: programKeys.templates })
  }
}

// ── Программа ───────────────────────────────────────────────────────────────

export const useApproveProgramReview = () => {
  const invalidate = useInvalidateReviews()
  return useMutation({
    mutationFn: (id: number) => adminProgramReviewControllerApprove(id),
    meta: { successMessage: 'Опубликовано, автор получит сообщение' },
    onSuccess: invalidate,
  })
}

export const useRejectProgramReview = () => {
  const invalidate = useInvalidateReviews()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminProgramReviewControllerReject(id, { reason }),
    meta: { successMessage: 'Отклонено, автор получит причину', inlineFieldErrors: true },
    onSuccess: invalidate,
  })
}

export const useTakeDownProgram = () => {
  const invalidate = useInvalidateReviews()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminProgramReviewControllerTakeDown(id, { reason }),
    meta: { successMessage: 'Снято из каталога, автор получит причину', inlineFieldErrors: true },
    onSuccess: invalidate,
  })
}

export const useDeleteProgramReview = () => {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateReviews()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminProgramReviewControllerRemove(id, { reason }),
    meta: { successMessage: 'Программа удалена, автор получит причину', inlineFieldErrors: true },
    onSuccess: (_, { id }) => {
      // Удалённую не перезапрашиваем: иначе общий тост покажет 404
      queryClient.removeQueries({ queryKey: programReviewKeys.detail(id) })
      invalidate()
    },
  })
}

// ── Свои теги автора ────────────────────────────────────────────────────────

export const useApproveProgramTag = () => {
  const invalidate = useInvalidateReviews()
  return useMutation({
    mutationFn: (tagId: number) => adminProgramReviewControllerApproveTag(tagId),
    meta: { successMessage: 'Тег в справочнике' },
    onSuccess: invalidate,
  })
}

export const useReplaceProgramTag = () => {
  const invalidate = useInvalidateReviews()
  return useMutation({
    mutationFn: ({ tagId, targetId }: { tagId: number; targetId: number }) =>
      adminProgramReviewControllerReplaceTag(tagId, { targetId }),
    meta: { successMessage: 'Тег заменён, автор получит сообщение' },
    onSuccess: invalidate,
  })
}

export const useRejectProgramTag = () => {
  const invalidate = useInvalidateReviews()
  return useMutation({
    mutationFn: (tagId: number) => adminProgramReviewControllerRejectTag(tagId),
    meta: { successMessage: 'Тег отклонён, автор получит сообщение' },
    onSuccess: invalidate,
  })
}
