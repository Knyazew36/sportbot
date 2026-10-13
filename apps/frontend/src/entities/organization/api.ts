import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type OrgRole, sessionKeys } from '@/entities/session'
import { http, type ISODateString } from '@/shared/api'

export interface Organization {
  id: number
  name: string
  /** false — организация удалена (мягко) */
  active: boolean
  settings: Record<string, unknown> | null
  ownerUserId: number
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface OrganizationMember {
  userId: number
  /** null, если смотрящему email не положен */
  email: string | null
  name: string | null
  lastName: string | null
  avatarUrl: string | null
  role: OrgRole
  createdAt: ISODateString
}

export interface OrganizationBody {
  name: string
  settings?: Record<string, unknown>
}

export const organizationKeys = {
  detail: (id: number) => ['organization', id] as const,
  members: (id: number) => ['organization', id, 'members'] as const,
}

// ── Организация ─────────────────────────────────────────────────────────────

export const useOrganization = (id: number) =>
  useQuery({ queryKey: organizationKeys.detail(id), queryFn: () => http.get<Organization>(`/organization/${id}`) })

// Список организаций пользователя приходит в /user/me — после мутаций обновляем его, а не отдельный список
export const useCreateOrganization = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: OrganizationBody) => http.post<Organization>('/organization/create', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.me }),
  })
}

export const useUpdateOrganization = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<OrganizationBody>) => http.post<Organization>(`/organization/update/${id}`, body),
    onSuccess: organization => {
      queryClient.setQueryData(organizationKeys.detail(id), organization)
      return queryClient.invalidateQueries({ queryKey: sessionKeys.me })
    },
  })
}

export const useDeleteOrganization = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => http.post<Organization>(`/organization/delete/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.me }),
  })
}

// ── Участники ───────────────────────────────────────────────────────────────

export const useOrganizationMembers = (id: number) =>
  useQuery({
    queryKey: organizationKeys.members(id),
    queryFn: () => http.get<OrganizationMember[]>(`/organization/${id}/member/list`),
  })

/** Смена роли. role=OWNER — передача владения: прежний владелец становится ADMIN */
export const useUpdateMember = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: OrgRole }) =>
      http.post<OrganizationMember>(`/organization/${id}/member/update/${userId}`, { role }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: organizationKeys.members(id) }),
        queryClient.invalidateQueries({ queryKey: sessionKeys.me }),
      ]),
  })
}

/** Исключить участника или выйти самому (userId = свой id) */
export const useDeleteMember = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => http.post<unknown>(`/organization/${id}/member/delete/${userId}`),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: organizationKeys.members(id) }),
        queryClient.invalidateQueries({ queryKey: sessionKeys.me }),
      ]),
  })
}
