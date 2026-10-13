import {
  BellIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  LinkIcon,
  type LucideIcon,
  SettingsIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react'

import type { AppAbility, AppAction, AppSubject } from '@/entities/session'
import { buildPath, ROUTES } from '@/shared/config/paths'

export type NavItem = {
  key: string
  label: string
  icon: LucideIcon
  /** Шаблон из ROUTES с единственным параметром :orgId */
  route: (typeof ROUTES)[keyof typeof ROUTES]
  /** Пункт виден по праву роли — тому же, что проверяет маршрут (app/router/routes.ts) */
  can?: [AppAction, AppSubject]
  /** Попадает в нижнее меню мобильного (остальное — в «Ещё») */
  mobile?: boolean
}

export const NAV_MAIN: NavItem[] = [
  { key: 'dashboard', label: 'Главная', icon: LayoutDashboardIcon, route: ROUTES.DASHBOARD, mobile: true },
  { key: 'members', label: 'Участники', icon: UsersIcon, route: ROUTES.MEMBERS, mobile: true },
  { key: 'notifications', label: 'Уведомления', icon: BellIcon, route: ROUTES.NOTIFICATIONS, mobile: true },
]

export const NAV_ADMIN: NavItem[] = [
  { key: 'invites', label: 'Приглашения', icon: LinkIcon, route: ROUTES.INVITES, can: ['manage', 'Invite'] },
  {
    key: 'join-requests',
    label: 'Заявки',
    icon: UserPlusIcon,
    route: ROUTES.JOIN_REQUESTS,
    can: ['manage', 'JoinRequest'],
  },
  { key: 'audit-log', label: 'Журнал действий', icon: HistoryIcon, route: ROUTES.AUDIT_LOG, can: ['read', 'AuditLog'] },
  { key: 'settings', label: 'Настройки', icon: SettingsIcon, route: ROUTES.SETTINGS, can: ['manage', 'Organization'] },
]

export const navHref = (item: NavItem, orgId: number) => buildPath(item.route as typeof ROUTES.APP, { orgId })

export const navFor = (ability: AppAbility) => {
  const allowed = (item: NavItem) => !item.can || ability.can(item.can[0], item.can[1])
  return { main: NAV_MAIN.filter(allowed), admin: NAV_ADMIN.filter(allowed) }
}
