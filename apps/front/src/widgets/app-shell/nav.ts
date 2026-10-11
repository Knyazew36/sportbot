import {
  BanknoteIcon,
  BellIcon,
  BuildingIcon,
  CalendarRangeIcon,
  CircleUserIcon,
  ClipboardListIcon,
  DatabaseIcon,
  HouseIcon,
  KeyRoundIcon,
  LifeBuoyIcon,
  type LucideIcon,
  NotebookTabsIcon,
  PlugIcon,
  SunIcon,
  UsersIcon,
  WrenchIcon,
} from 'lucide-react'
import { to } from '@/shared/config/paths'
import type { DemoRole } from '@/shared/mock/state'

export type NavItem = {
  key: string
  label: string
  icon: LucideIcon
  href: (orgId: string) => string
  // Пункт виден по фактическому праву, а не по названию раздела (§2)
  roles: DemoRole[]
  // Попадает в нижнее меню мобильного (остальное — в «Ещё»)
  mobile?: boolean
  badge?: number
}

const ALL: DemoRole[] = ['owner', 'manager', 'employee']
const TEAM: DemoRole[] = ['owner', 'manager']

export const NAV_MAIN: NavItem[] = [
  { key: 'today', label: 'Сегодня', icon: SunIcon, href: to.today, roles: TEAM, mobile: true },
  { key: 'calendar', label: 'Календарь', icon: CalendarRangeIcon, href: to.calendar, roles: TEAM, mobile: true },
  { key: 'bookings', label: 'Брони', icon: NotebookTabsIcon, href: to.bookings, roles: TEAM },
  { key: 'tasks', label: 'Задачи', icon: ClipboardListIcon, href: to.tasks, roles: TEAM, mobile: true, badge: 3 },
  { key: 'properties', label: 'Объекты', icon: HouseIcon, href: to.properties, roles: TEAM },
  { key: 'money', label: 'Деньги', icon: BanknoteIcon, href: to.money, roles: ['owner'], badge: 1 },
  { key: 'specialists', label: 'Специалисты', icon: WrenchIcon, href: to.specialists, roles: TEAM },
]

export const NAV_SETTINGS: NavItem[] = [
  { key: 'team', label: 'Команда и доступ', icon: UsersIcon, href: (o) => to.settings('team', o), roles: ['owner'] },
  { key: 'channels', label: 'Подключения площадок', icon: PlugIcon, href: (o) => to.settings('channels', o), roles: TEAM },
  { key: 'page', label: 'Страница владельца', icon: BuildingIcon, href: (o) => to.settings('page', o), roles: ['owner'] },
  { key: 'requisites', label: 'Реквизиты', icon: KeyRoundIcon, href: (o) => to.settings('requisites', o), roles: ['owner'] },
  { key: 'notifications', label: 'Уведомления и MAX', icon: BellIcon, href: (o) => to.settings('notifications', o), roles: TEAM },
  { key: 'export', label: 'Данные и выгрузки', icon: DatabaseIcon, href: (o) => to.settings('export', o), roles: ['owner'] },
]

// У сотрудника своя короткая навигация: стартовая — «Мои задачи» (§2)
export const NAV_EMPLOYEE: NavItem[] = [
  { key: 'tasks', label: 'Мои задачи', icon: ClipboardListIcon, href: to.tasks, roles: ['employee'], mobile: true, badge: 2 },
  { key: 'notifications', label: 'Уведомления', icon: BellIcon, href: to.notifications, roles: ['employee'], mobile: true },
  { key: 'profile', label: 'Профиль и помощь', icon: CircleUserIcon, href: to.profile, roles: ['employee'], mobile: true },
]

export const NAV_HELP: NavItem = { key: 'help', label: 'Помощь', icon: LifeBuoyIcon, href: to.help, roles: ALL }

export const navFor = (role: DemoRole) => ({
  main: role === 'employee' ? NAV_EMPLOYEE : NAV_MAIN.filter((item) => item.roles.includes(role)),
  settings: NAV_SETTINGS.filter((item) => item.roles.includes(role)),
})
