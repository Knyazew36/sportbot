import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { http, type ISODateString, type Paginated } from '@/shared/api'

export type NotificationChannel = 'EMAIL' | 'TELEGRAM' | 'MAX' | 'VK' | 'IN_APP'
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ'

export interface Notification {
  id: number
  organizationId: number
  userId: number
  /** Ключ события из notifications/event-registry.ts сервера */
  eventType: string
  channel: NotificationChannel
  title: string
  body: string
  payload: Record<string, unknown> | null
  status: NotificationStatus
  readAt: ISODateString | null
  sentAt: ISODateString | null
  error: string | null
  createdAt: ISODateString
}

export interface NotificationsQuery {
  page?: number
  limit?: number
  filter_unread?: boolean
  filter_organizationId?: number
}

const KEY = 'notification'

export const notificationKeys = {
  list: (query: NotificationsQuery) => [KEY, 'list', query] as const,
  unreadCount: [KEY, 'unread-count'] as const,
}

export const useNotifications = (query: NotificationsQuery) =>
  useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: () => http.get<Paginated<Notification>>('/notifications/list', query),
    placeholderData: keepPreviousData,
  })

/** Счётчик для колокольчика; опрашивается раз в минуту, пока вкладка открыта */
export const useUnreadCount = () =>
  useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => http.get<{ count: number }>('/notifications/unread-count'),
    select: data => data.count,
    refetchInterval: 60_000,
  })

export const useReadNotification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => http.post<Notification>(`/notifications/read/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export const useReadAllNotifications = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => http.post<{ count: number }>('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}
