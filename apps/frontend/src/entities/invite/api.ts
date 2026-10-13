import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { OrgRole } from '@/entities/session'
import { http, type ISODateString, type Paginated, type PaginationQuery } from '@/shared/api'

export interface Invite {
  id: number
  organizationId: number
  /** Длинный токен для ссылки /invite/:token */
  token: string
  createdByUserId: number
  /** null — бессрочно */
  expiresAt: ISODateString | null
  usedCount: number
  createdAt: ISODateString
}

export interface InvitePreview {
  organizationId: number
  organizationName: string
  ownerName: string
  ownerAvatarUrl: string | null
}

export interface RedeemResult {
  organizationId: number
  alreadyMember: boolean
  /** true — заявка создана и ждёт решения владельца */
  pending: boolean
  role: OrgRole | null
  joinRequestId: number | null
}

export const inviteKeys = {
  list: (organizationId: number, query?: PaginationQuery) => ['invite', organizationId, query ?? {}] as const,
  preview: (token: string) => ['invite-preview', token] as const,
}

export const useInvites = (organizationId: number, query: PaginationQuery) =>
  useQuery({
    queryKey: inviteKeys.list(organizationId, query),
    queryFn: () => http.get<Paginated<Invite>>('/invite/list', { organizationId, ...query }),
    placeholderData: keepPreviousData,
  })

export const useCreateInvite = (organizationId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body?: { expiresAt?: string }) => http.post<Invite>('/invite/create', { organizationId, ...body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invite', organizationId] }),
  })
}

export const useDeleteInvite = (organizationId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => http.post<Invite>(`/invite/delete/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invite', organizationId] }),
  })
}

/** Публичное превью: какая организация ждёт по ссылке — показывается ещё до входа */
export const useInvitePreview = (token: string) =>
  useQuery({
    queryKey: inviteKeys.preview(token),
    queryFn: () => http.get<InvitePreview>('/invite/preview', { token }),
  })

export const useRedeemInvite = () =>
  useMutation({ mutationFn: (token: string) => http.post<RedeemResult>('/invite/redeem', { token }) })
