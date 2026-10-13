import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { http, type ISODateString, type Paginated } from '@/shared/api'

export interface AuditLogItem {
  id: number
  /** "<entity>.<verb>", например invite.create */
  action: string
  entity: string
  entityId: number | null
  /** Тело запроса на момент действия (санитизировано сервером) */
  payload: unknown
  userId: number | null
  userDisplayName: string | null
  createdAt: ISODateString
}

export interface AuditLogQuery {
  entity?: string
  action?: string
  userId?: number
  /** Начало и конец периода, YYYY-MM-DD */
  from?: string
  to?: string
  page?: number
  limit?: number
}

export const useAuditLog = (organizationId: number, query: AuditLogQuery) =>
  useQuery({
    queryKey: ['audit-log', organizationId, query] as const,
    queryFn: () => http.get<Paginated<AuditLogItem>>('/audit-log/list', { organizationId, ...query }),
    placeholderData: keepPreviousData,
  })
