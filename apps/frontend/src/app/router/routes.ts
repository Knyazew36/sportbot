import type { ComponentType } from 'react'

import type { AppAction, AppSubject } from '@/entities/session'
import LibraryPage from '@/pages/library/LibraryPage'
import MePage from '@/pages/me/MePage'
import NotFoundPage from '@/pages/not-found/NotFoundPage'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import ProgramsPage from '@/pages/programs/ProgramsPage'
import StatsPage from '@/pages/stats/StatsPage'
import TodayPage from '@/pages/today/TodayPage'
import WorkoutPage from '@/pages/workout/WorkoutPage'
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
// Разделы нижнего меню, первый запуск и тренировка — в основном бандле: на них попадают сразу после входа,
// переход не должен ждать чанк. Остальное — вложенные экраны, их догружаем по требованию
export const miniappRoutes: AppRoute[] = [
  { path: ROUTES.TODAY, Component: TodayPage },
  { path: ROUTES.PROGRAMS, Component: ProgramsPage },
  { path: ROUTES.PROGRAM_TEMPLATES, lazy: () => import('@/pages/programs/TemplatesPage') },
  { path: ROUTES.PROGRAMS_MINE, lazy: () => import('@/pages/programs/MyProgramsPage') },
  { path: ROUTES.PROGRAM_TEMPLATE, lazy: () => import('@/pages/programs/TemplatePage') },
  { path: ROUTES.PROGRAM_SHARED, lazy: () => import('@/pages/programs/SharedProgramPage') },
  { path: ROUTES.PROGRAM, lazy: () => import('@/pages/programs/ProgramEditorPage') },
  { path: ROUTES.PROGRAM_COMPLEX, lazy: () => import('@/pages/programs/ComplexPage') },
  { path: ROUTES.PROGRAM_ADD_EXERCISE, lazy: () => import('@/pages/programs/AddExercisePage') },
  { path: ROUTES.LIBRARY, Component: LibraryPage },
  { path: ROUTES.EXERCISE, lazy: () => import('@/pages/library/ExercisePage') },
  { path: ROUTES.STRETCH, lazy: () => import('@/pages/library/StretchPage') },
  { path: ROUTES.STATS, Component: StatsPage },
  { path: ROUTES.STATS_EXERCISES, lazy: () => import('@/pages/stats-exercises/StatsExercisesPage') },
  { path: ROUTES.STATS_EXERCISE, lazy: () => import('@/pages/stats-exercise/StatsExercisePage') },
  { path: ROUTES.STATS_RECORDS, lazy: () => import('@/pages/stats-records/StatsRecordsPage') },
  { path: ROUTES.STATS_WORKOUT, lazy: () => import('@/pages/stats-workout/StatsWorkoutPage') },
  { path: ROUTES.STATS_DAY, lazy: () => import('@/pages/stats-day/StatsDayPage') },
  { path: ROUTES.ME, Component: MePage },
  { path: ROUTES.ME_SECTION, lazy: () => import('@/pages/me/MeSectionPage') },
  { path: ROUTES.ME_DEVELOPER, lazy: () => import('@/pages/developer/DeveloperPage') },
  { path: ROUTES.ME_EDITOR, lazy: () => import('@/pages/editor/EditorPage') },
  { path: ROUTES.ME_EDITOR_FILES, lazy: () => import('@/pages/editor/EditorFilesPage') },
  { path: ROUTES.ME_EDITOR_COMPOSITION, lazy: () => import('@/pages/editor/EditorCompositionPage') },
  { path: ROUTES.ME_SUPPORT, lazy: () => import('@/pages/support/SupportPage') },
  { path: ROUTES.FRIEND, lazy: () => import('@/pages/friend/FriendPage') },
  { path: ROUTES.ADMIN, lazy: () => import('@/pages/admin/AdminPage') },
  { path: ROUTES.ADMIN_REQUEST, lazy: () => import('@/pages/admin/ModerationRequestPage') },
  { path: ROUTES.ADMIN_PROGRAM_REVIEW, lazy: () => import('@/pages/admin/ProgramReviewPage') },
  { path: ROUTES.ADMIN_CATALOG_ITEM, lazy: () => import('@/pages/admin/CatalogItemPage') },
  { path: ROUTES.ADMIN_TEMPLATE, lazy: () => import('@/pages/admin/TemplateEditorPage') },
  { path: ROUTES.ADMIN_TEMPLATE_COMPLEX, lazy: () => import('@/pages/admin/TemplateComplexPage') },
  { path: ROUTES.ADMIN_TEMPLATE_ADD_EXERCISE, lazy: () => import('@/pages/admin/TemplateAddExercisePage') },
  { path: ROUTES.ONBOARDING, Component: OnboardingPage },
  { path: ROUTES.WORKOUT, Component: WorkoutPage },
  { path: ROUTES.WORKOUT_REPLACE, lazy: () => import('@/pages/workout/ReplaceExercisePage') },
  { path: ROUTES.WORKOUT_FINISHED, lazy: () => import('@/pages/workout-finished/WorkoutFinishedPage') },
  { path: ROUTES.WORKOUT_SUMMARY, lazy: () => import('@/pages/workout/SummaryPage') },
  { path: ROUTES.WORKOUT_EDIT, lazy: () => import('@/pages/workout-edit/WorkoutEditPage') },
  { path: ROUTES.COOLDOWN, lazy: () => import('@/pages/cooldown/CooldownPage') },
  { path: ROUTES.WORKOUT_RESULT, lazy: () => import('@/pages/workout-result/WorkoutResultPage') },
]

// ── Публичные: доступны всем ────────────────────────────────────────────────
export const publicRoutes: AppRoute[] = [
  { path: ROUTES.INVITE, lazy: () => import('@/pages/invite/InvitePage') },
  // 404 грузим сразу: страница крошечная, отдельный чанк не окупается
  { path: '*', Component: NotFoundPage },
]
