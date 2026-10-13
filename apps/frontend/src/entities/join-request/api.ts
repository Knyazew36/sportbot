import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { organizationKeys } from '@/entities/organization/api'
import { http, type ISODateString, type Paginated, type PaginationQuery } from '@/shared/api'

export type JoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export const JOIN_REQUEST_STATUS_LABEL: Record<JoinRequestStatus, string> = {
  PENDING: 'Ждёт решения',
  APPROVED: 'Одобрена',
  REJECTED: 'Отклонена',
  CANCELLED: 'Отменена',
}

export interface JoinRequest {
  id: number
  organizationId: number
  organizationName: string
  userId: number
  email: string | null
  name: string | null
  lastName: string | null
  avatarUrl: string | null
  phone: string | null
  inviteId: number | null
  status: JoinRequestStatus
  createdAt: ISODateString
  decidedAt: ISODateString | null
}

export type JoinRequestQuery = PaginationQuery & { status?: JoinRequestStatus }

const KEY = 'join-request'

export const joinRequestKeys = {
  mine: [KEY, 'mine'] as const,
  list: (organizationId: number, query?: JoinRequestQuery) => [KEY, organizationId, query ?? {}] as const,
}

/** Свои заявки пользователя во все организации */
export const useMyJoinRequests = () =>
  useQuery({ queryKey: joinRequestKeys.mine, queryFn: () => http.get<JoinRequest[]>('/join-request/mine') })

export const useJoinRequests = (organizationId: number, query: JoinRequestQuery) =>
  useQuery({
    queryKey: joinRequestKeys.list(organizationId, query),
    queryFn: () => http.get<Paginated<JoinRequest>>('/join-request/list', { organizationId, ...query }),
    placeholderData: keepPreviousData,
  })

type Decision = 'approve' | 'reject' | 'cancel'

/** Решение по заявке: approve/reject — владелец или админ, cancel — сам заявитель */
export const useDecideJoinRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: Decision }) =>
      http.post<JoinRequest>(`/join-request/${id}/${decision}`),
    onSuccess: request =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [KEY] }),
        // Одобренная заявка добавляет участника
        queryClient.invalidateQueries({ queryKey: organizationKeys.members(request.organizationId) }),
      ]),
  })
}
