import { generatePath } from 'react-router'

// Шаблоны маршрутов — единственный источник путей: роутер берёт их как есть, ссылки собирает buildPath
export const ROUTES = {
  HOME: '/',

  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  INVITE: '/invite/:token',
  // Витрина иллюстраций
  UI: '/ui',
  WORKSPACES: '/workspaces',

  APP: '/app/:orgId',
  DASHBOARD: '/app/:orgId/dashboard',
  MEMBERS: '/app/:orgId/members',
  INVITES: '/app/:orgId/invites',
  JOIN_REQUESTS: '/app/:orgId/join-requests',
  NOTIFICATIONS: '/app/:orgId/notifications',
  AUDIT_LOG: '/app/:orgId/audit-log',
  SETTINGS: '/app/:orgId/settings',
  PROFILE: '/app/:orgId/profile',

  // Mini App: открывается из бота, пользователь определяется по данным запуска мессенджера
  TODAY: '/today',
  PROGRAMS: '/programs',
  LIBRARY: '/library',
  STATS: '/stats',
  STATS_EXERCISES: '/stats/exercises',
  STATS_EXERCISE: '/stats/exercises/:exerciseId',
  STATS_RECORDS: '/stats/records',
  STATS_WORKOUT: '/stats/workouts/:workoutId',
  STATS_DAY: '/stats/days/:date',
  ME: '/me',
  ME_SECTION: '/me/:section',
  ME_DEVELOPER: '/me/developer',
  // Редактор роликов: хаб, форма ролика, свои файлы. Статичные пути выигрывают у /me/:section
  ME_EDITOR: '/me/editor',
  ME_EDITOR_FILES: '/me/editor/files',
  ME_EDITOR_COMPOSITION: '/me/editor/:compositionId',
  ME_SUPPORT: '/me/support',
  ADMIN: '/admin',
  ONBOARDING: '/onboarding',
  WORKOUT: '/workout',
  WORKOUT_REPLACE: '/workout/replace/:itemId',
  WORKOUT_ADD: '/workout/add',
  WORKOUT_SUMMARY: '/workout/:workoutId/summary',
  WORKOUT_FINISHED: '/workout/:workoutId/finished',
  WORKOUT_EDIT: '/workout/:workoutId/edit',
  WORKOUT_EDIT_ADD: '/workout/:workoutId/edit/add',
  COOLDOWN: '/workout/:workoutId/cooldown',
  WORKOUT_RESULT: '/result/:token',
  PROGRAM: '/programs/:programId',
  PROGRAM_TEMPLATES: '/programs/templates',
  PROGRAMS_MINE: '/programs/mine',
  PROGRAM_TEMPLATE: '/programs/templates/:templateId',
  PROGRAM_SHARED: '/programs/shared/:token',
  PROGRAM_COMPLEX: '/programs/:programId/complex/:complexId',
  PROGRAM_ADD_EXERCISE: '/programs/:programId/add/:complexId',
  EXERCISE: '/library/exercises/:exerciseId',
  STRETCH: '/library/stretches/:stretchId',
  FRIEND: '/friends/:friendId',
  ADMIN_REQUEST: '/admin/moderation/:requestId',
  ADMIN_USER: '/admin/users/:userId',
  ADMIN_PROGRAM_REVIEW: '/admin/program-reviews/:programId',
  ADMIN_CATALOG_ITEM: '/admin/catalog/:kind/:itemId',
  ADMIN_TEMPLATE: '/admin/templates/:templateId',
  ADMIN_TEMPLATE_COMPLEX: '/admin/templates/:templateId/complex/:complexId',
  ADMIN_TEMPLATE_ADD_EXERCISE: '/admin/templates/:templateId/add/:complexId',
} as const

export type RoutePattern = (typeof ROUTES)[keyof typeof ROUTES]

// Имена параметров выводятся из строки шаблона: `/app/:orgId/items/:itemId/:tab?` → orgId, itemId, tab?
type ParamToken<P extends string> = P extends `${string}:${infer Param}/${infer Rest}`
  ? Param | ParamToken<`/${Rest}`>
  : P extends `${string}:${infer Param}`
    ? Param
    : never

type OptionalParam<P extends string> =
  ParamToken<P> extends infer T ? (T extends `${infer Name}?` ? Name : never) : never
type RequiredParam<P extends string> = Exclude<ParamToken<P>, `${string}?`>

type ParamValue = string | number

export type PathParams<P extends string> = { [K in RequiredParam<P>]: ParamValue } & {
  [K in OptionalParam<P>]?: ParamValue
}

/**
 * Собирает ссылку из шаблона. Параметры проверяются типами: пропущенный или лишний — ошибка компиляции.
 * buildPath(ROUTES.MEMBERS, { orgId: 1 }) → '/app/1/members'
 */
export function buildPath<P extends string>(
  pattern: P,
  ...[params]: [RequiredParam<P>] extends [never] ? [params?: PathParams<P>] : [params: PathParams<P>]
): string {
  const values = Object.fromEntries(Object.entries(params ?? {}).map(([key, value]) => [key, String(value)]))
  return generatePath(pattern as string, values)
}

/** Состояние навигации на страницы входа: куда вернуть пользователя и какой email подставить */
export type AuthLocationState = { from?: string; email?: string }
