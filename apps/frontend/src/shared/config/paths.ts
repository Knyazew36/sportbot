import { generatePath } from 'react-router'

// Шаблоны маршрутов — единственный источник путей: роутер берёт их как есть, ссылки собирает buildPath
export const ROUTES = {
  HOME: '/',
  UI: '/ui',

  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  INVITE: '/invite/:token',
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
