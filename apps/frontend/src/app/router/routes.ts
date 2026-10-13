import type { ComponentType } from 'react'

import type { AppAction, AppSubject } from '@/entities/session'
import NotFoundPage from '@/pages/not-found/NotFoundPage'
import { ROUTES } from '@/shared/config/paths'

// Либо страница грузится сразу (Component), либо отдельным чанком при первом переходе (lazy)
export type AppRoute = {
  path: string
  /** Право, без которого страница заменяется заглушкой «Нет доступа» (только для маршрутов кабинета) */
  can?: [AppAction, AppSubject]
} & (
  { Component: ComponentType; lazy?: never } | { lazy: () => Promise<{ default: ComponentType }>; Component?: never }
)

// ── Кабинет: внутри оболочки AppShell (/app/:orgId/*) ───────────────────────
export const appRoutes: AppRoute[] = [
  { path: ROUTES.DASHBOARD, lazy: () => import('@/pages/dashboard/DashboardPage') },
  { path: ROUTES.MEMBERS, lazy: () => import('@/pages/members/MembersPage') },
  { path: ROUTES.INVITES, can: ['manage', 'Invite'], lazy: () => import('@/pages/invites/InvitesPage') },
  {
    path: ROUTES.JOIN_REQUESTS,
    can: ['manage', 'JoinRequest'],
    lazy: () => import('@/pages/join-requests/JoinRequestsPage'),
  },
  { path: ROUTES.NOTIFICATIONS, lazy: () => import('@/pages/notifications/NotificationsPage') },
  { path: ROUTES.AUDIT_LOG, can: ['read', 'AuditLog'], lazy: () => import('@/pages/audit-log/AuditLogPage') },
  { path: ROUTES.SETTINGS, can: ['manage', 'Organization'], lazy: () => import('@/pages/settings/SettingsPage') },
  { path: ROUTES.PROFILE, lazy: () => import('@/pages/profile/ProfilePage') },
]

// ── Приватные вне оболочки кабинета ─────────────────────────────────────────
export const privateRoutes: AppRoute[] = [
  { path: ROUTES.WORKSPACES, lazy: () => import('@/pages/workspaces/WorkspacesPage') },
]

// ── Гостевые: только без входа, иначе редирект на главную ───────────────────
export const guestRoutes: AppRoute[] = [
  { path: ROUTES.LOGIN, lazy: () => import('@/pages/auth/LoginPage') },
  { path: ROUTES.REGISTER, lazy: () => import('@/pages/auth/RegisterPage') },
  { path: ROUTES.VERIFY_EMAIL, lazy: () => import('@/pages/auth/VerifyEmailPage') },
  { path: ROUTES.FORGOT_PASSWORD, lazy: () => import('@/pages/auth/ForgotPasswordPage') },
  { path: ROUTES.RESET_PASSWORD, lazy: () => import('@/pages/auth/ResetPasswordPage') },
]

// ── Публичные: доступны всем ────────────────────────────────────────────────
export const publicRoutes: AppRoute[] = [
  { path: ROUTES.INVITE, lazy: () => import('@/pages/invite/InvitePage') },
  { path: ROUTES.UI, lazy: () => import('@/pages/ui/UiPage') },
  // 404 грузим сразу: страница крошечная, отдельный чанк не окупается
  { path: '*', Component: NotFoundPage },
]
