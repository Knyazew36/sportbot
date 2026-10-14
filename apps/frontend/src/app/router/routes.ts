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

// ── Mini App: внутри MiniappRoute (вход из бота, нижнее меню) ──────────────
// Разделы без логики пока показывают заглушку; по мере готовности блоков сюда встают настоящие страницы
const soon = () => import('@/pages/soon/SoonPage')

export const miniappRoutes: AppRoute[] = [
  { path: ROUTES.TODAY, lazy: soon },
  { path: ROUTES.PROGRAMS, lazy: soon },
  { path: ROUTES.LIBRARY, lazy: soon },
  { path: ROUTES.STATS, lazy: soon },
  { path: ROUTES.ME, lazy: soon },
  { path: ROUTES.ADMIN, lazy: soon },
  { path: ROUTES.ONBOARDING, lazy: soon },
]

// ── Превью дизайна: внутри оболочки PreviewLayout (/preview/*) ─────────────
export const previewRoutes: AppRoute[] = [
  { path: ROUTES.PREVIEW_TODAY, lazy: () => import('@/pages/preview/TodayScreen') },
  { path: ROUTES.PREVIEW_WORKOUT, lazy: () => import('@/pages/preview/WorkoutScreen') },
  { path: ROUTES.PREVIEW_SUMMARY, lazy: () => import('@/pages/preview/SummaryScreen') },
  { path: ROUTES.PREVIEW_COOLDOWN, lazy: () => import('@/pages/preview/CooldownScreen') },
  { path: ROUTES.PREVIEW_STATS, lazy: () => import('@/pages/preview/StatsScreen') },
  { path: ROUTES.PREVIEW_PROGRAMS, lazy: () => import('@/pages/preview/ProgramsScreen') },
  { path: ROUTES.PREVIEW_PROGRAM_TEMPLATES, lazy: () => import('@/pages/preview/TemplatesScreen') },
  { path: ROUTES.PREVIEW_PROGRAM_TEMPLATE, lazy: () => import('@/pages/preview/TemplateScreen') },
  { path: ROUTES.PREVIEW_PROGRAM, lazy: () => import('@/pages/preview/ProgramEditorScreen') },
  { path: ROUTES.PREVIEW_PROGRAM_ADD_EXERCISE, lazy: () => import('@/pages/preview/AddExerciseScreen') },
  { path: ROUTES.PREVIEW_PROFILE, lazy: () => import('@/pages/preview/ProfileScreen') },
  { path: ROUTES.PREVIEW_UI, lazy: () => import('@/pages/preview/UiKitScreen') },
  { path: ROUTES.PREVIEW_WORKOUT_REPLACE, lazy: () => import('@/pages/preview/ReplaceExerciseScreen') },
  { path: ROUTES.PREVIEW_LIBRARY, lazy: () => import('@/pages/preview/LibraryScreen') },
  { path: ROUTES.PREVIEW_LIBRARY_NEW, lazy: () => import('@/pages/preview/NewEntryScreen') },
  { path: ROUTES.PREVIEW_EXERCISE, lazy: () => import('@/pages/preview/ExerciseScreen') },
  { path: ROUTES.PREVIEW_STRETCH, lazy: () => import('@/pages/preview/StretchScreen') },
  { path: ROUTES.PREVIEW_FRIEND, lazy: () => import('@/pages/preview/FriendScreen') },
  { path: ROUTES.PREVIEW_ONBOARDING, lazy: () => import('@/pages/preview/OnboardingScreen') },
  { path: ROUTES.PREVIEW_ENTRY, lazy: () => import('@/pages/preview/EntryErrorScreen') },
  { path: ROUTES.PREVIEW_ADMIN, lazy: () => import('@/pages/preview/admin/AdminScreen') },
  { path: ROUTES.PREVIEW_ADMIN_CATALOG_ITEM, lazy: () => import('@/pages/preview/admin/CatalogItemScreen') },
  { path: ROUTES.PREVIEW_ADMIN_TEMPLATE, lazy: () => import('@/pages/preview/admin/TemplateEditorScreen') },
  { path: ROUTES.PREVIEW_ADMIN_MODERATION, lazy: () => import('@/pages/preview/admin/ModerationScreen') },
]

// ── Публичные: доступны всем ────────────────────────────────────────────────
export const publicRoutes: AppRoute[] = [
  { path: ROUTES.INVITE, lazy: () => import('@/pages/invite/InvitePage') },
  { path: ROUTES.UI, lazy: () => import('@/pages/ui/UiPage') },
  // 404 грузим сразу: страница крошечная, отдельный чанк не окупается
  { path: '*', Component: NotFoundPage },
]
