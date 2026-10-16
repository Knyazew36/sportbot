import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { programKeys } from '@/entities/program'
import {
  adminProgramReviewControllerApprove,
  adminProgramReviewControllerApproveTag,
  adminProgramReviewControllerList,
  adminProgramReviewControllerOne,
  adminProgramReviewControllerReject,
  adminProgramReviewControllerRejectTag,
  adminProgramReviewControllerReplaceTag,
  adminProgramReviewControllerTakeDown,
} from '@/shared/api/generated/admin-program-reviews/admin-program-reviews'
import type { ProgramReviewListItemResponseDto, ProgramReviewResponseDto } from '@/shared/api/generated/model'

import { adminKeys, nextPage } from './api'

export type ProgramReview = ProgramReviewResponseDto
export type ProgramReviewListItem = ProgramReviewListItemResponseDto

const PAGE_SIZE = 30

export const programReviewKeys = {
  all: ['admin', 'program-reviews'] as const,
  list: ['admin', 'program-reviews', 'list'] as const,
  detail: (id: number) => ['admin', 'program-reviews', 'detail', id] as const,
}

/** Очередь программ пользователей: первые публикации, правки текста, свои теги */
export const useProgramReviews = () =>
  useInfiniteQuery({
    queryKey: programReviewKeys.list,
    queryFn: ({ pageParam }) => adminProgramReviewControllerList({ page: pageParam, limit: PAGE_SIZE }),
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
