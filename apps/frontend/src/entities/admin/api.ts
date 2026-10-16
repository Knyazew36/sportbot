import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { catalogKeys } from '@/entities/catalog'
import { programKeys } from '@/entities/program'
import {
  adminControllerApprove,
  adminControllerBlock,
  adminControllerCloseComplaint,
  adminControllerComplaints,
  adminControllerCounters,
  adminControllerDuplicate,
  adminControllerImportApply,
  adminControllerImportCheck,
  adminControllerReject,
  adminControllerRequest,
  adminControllerRequests,
  adminControllerUnblock,
  adminControllerUsers,
} from '@/shared/api/generated/admin/admin'
import type {
  AdminComplaintResponseDto,
  AdminRequestResponseDto,
  AdminUserResponseDto,
  ApproveRequestDto,
  CloseComplaintDto,
  ImportReportResponseDto,
} from '@/shared/api/generated/model'

import { adminCatalogKeys } from './catalog-api'

export type AdminRequest = AdminRequestResponseDto
export type AdminComplaint = AdminComplaintResponseDto
export type AdminUser = AdminUserResponseDto
export type ImportReport = ImportReportResponseDto

const PAGE_SIZE = 30

// Страница с бэка: { items, meta } — следующая есть, пока hasNextPage
export const nextPage = (last: { meta?: { page: number; hasNextPage: boolean } }) =>
  last.meta?.hasNextPage ? last.meta.page + 1 : undefined

export const adminKeys = {
  all: ['admin'] as const,
  counters: ['admin', 'counters'] as const,
  requests: ['admin', 'requests'] as const,
  request: (id: number) => ['admin', 'request', id] as const,
  complaints: ['admin', 'complaints'] as const,
  users: (search: string) => ['admin', 'users', search] as const,
}

/** Счётчики на вкладках и в нижнем меню: заявки и жалобы ждут реакции */
export const useAdminCounters = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: adminKeys.counters,
    queryFn: () => adminControllerCounters(),
    staleTime: 0,
    enabled,
  })

// ── Модерация ───────────────────────────────────────────────────────────────

export const useModerationQueue = () =>
  useInfiniteQuery({
    queryKey: adminKeys.requests,
    queryFn: ({ pageParam }) => adminControllerRequests({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    staleTime: 0,
  })

export const useModerationRequest = (id: number) =>
  useQuery({
    queryKey: adminKeys.request(id),
    queryFn: () => adminControllerRequest(id),
  })

// Исход заявки убирает её из очереди и меняет справочник: черновик стал записью или исчез
const useResolveRequest = () => {
  const queryClient = useQueryClient()
  return (request: AdminRequest) => {
    queryClient.setQueryData(adminKeys.request(request.id), request)
    void queryClient.invalidateQueries({ queryKey: adminKeys.requests })
    void queryClient.invalidateQueries({ queryKey: adminKeys.counters })
    void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
    void queryClient.invalidateQueries({ queryKey: adminCatalogKeys.all })
  }
}

export const useApproveRequest = () => {
  const resolve = useResolveRequest()
  return useMutation({
    mutationFn: ({ id, ...body }: ApproveRequestDto & { id: number }) => adminControllerApprove(id, body),
    meta: { successMessage: 'Одобрено, автор получит сообщение', inlineFieldErrors: true },
    onSuccess: resolve,
  })
}

export const useDuplicateRequest = () => {
  const resolve = useResolveRequest()
  return useMutation({
    mutationFn: ({ id, targetId, reason }: { id: number; targetId: number; reason?: string }) =>
      adminControllerDuplicate(id, { targetId, reason }),
    meta: { successMessage: 'Отмечено дублем, черновик заменён', inlineFieldErrors: true },
    onSuccess: resolve,
  })
}

export const useRejectRequest = () => {
  const resolve = useResolveRequest()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminControllerReject(id, { reason }),
    meta: { successMessage: 'Отклонено, автор получит причину', inlineFieldErrors: true },
    onSuccess: resolve,
  })
}

// ── Жалобы ──────────────────────────────────────────────────────────────────

/** Открытые жалобы: закрытые уходят из списка */
export const useComplaints = () =>
  useInfiniteQuery({
    queryKey: adminKeys.complaints,
    queryFn: ({ pageParam }) => adminControllerComplaints({ page: pageParam, limit: PAGE_SIZE, filter_status: 'OPEN' }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    staleTime: 0,
  })

export const useCloseComplaint = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: CloseComplaintDto & { id: number }) => adminControllerCloseComplaint(id, { status }),
    meta: { successMessage: 'Жалоба закрыта' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.complaints })
      void queryClient.invalidateQueries({ queryKey: adminKeys.counters })
    },
  })
}

// ── Пользователи ────────────────────────────────────────────────────────────

export const useAdminUsers = (search: string) =>
  useInfiniteQuery({
    queryKey: adminKeys.users(search),
    queryFn: ({ pageParam }) =>
      adminControllerUsers({ page: pageParam, limit: PAGE_SIZE, search: search || undefined }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    placeholderData: keepPreviousData,
  })

const useInvalidateUsers = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
}

export const useBlockUser = () => {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: (id: number) => adminControllerBlock(id),
    meta: { successMessage: 'Пользователь заблокирован' },
    onSuccess: invalidate,
  })
}

export const useUnblockUser = () => {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: (id: number) => adminControllerUnblock(id),
    meta: { successMessage: 'Пользователь разблокирован' },
    onSuccess: invalidate,
  })
}

// ── Импорт ──────────────────────────────────────────────────────────────────

/** Проверка файла без записи: отчёт, что будет создано и обновлено */
export const useImportCheck = () =>
  useMutation({
    mutationFn: (file: File) => adminControllerImportCheck({ file }),
    // Результат — отчёт на экране
    meta: { skipSuccessToast: true },
  })

export const useImportApply = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => adminControllerImportApply({ file }),
    meta: { successMessage: 'Импорт применён' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
      void queryClient.invalidateQueries({ queryKey: adminCatalogKeys.all })
      void queryClient.invalidateQueries({ queryKey: programKeys.templates })
      void queryClient.invalidateQueries({ queryKey: adminKeys.counters })
    },
  })
}
