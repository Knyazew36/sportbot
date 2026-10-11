import { Request } from 'express'

import { OrgRole, OrganizationMembership, User } from '@/generated/prisma/client'

// 'telegram'/'max' зарезервированы для auth-стратегий мини-приложений Telegram/MAX
// (messengers/telegram, messengers/max) — подключаются сами через AuthStrategyRegistry,
// только если заданы их env (см. messengers/app-messengers.ts).
export type AuthProvider = 'email' | 'vk' | 'telegram' | 'max'

export interface RequestWithOrganization extends Request {
  user?: User
  authProvider?: AuthProvider

  // --- проставляет OrgScopeGuard ---
  organizationId?: number
  // --- проставляет ResourceScopeGuard по @ResourceScope(...) ---
  // id приглашения запроса
  inviteId?: number
  // id правила расписания запроса
  scheduleRuleId?: number
  // id занятия запроса
  lessonId?: number
  // --- проставляет GroupScopeGuard ---
  // id группы запроса
  groupId?: number
  // строка членства текущего пользователя в организации; null при доступе через isPlatformAdmin
  orgMembership?: OrganizationMembership | null
  // роль в организации: OrgRole из членства, либо OWNER-эквивалент для платформенного админа
  orgRole?: OrgRole | null
  // true = доступ выдан через User.isPlatformAdmin, а не через строку членства
  isPlatformAccess?: boolean
}
