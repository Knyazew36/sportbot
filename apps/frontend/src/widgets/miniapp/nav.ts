import {
  BookOpenIcon,
  ChartNoAxesColumnIcon,
  LayersIcon,
  type LucideIcon,
  ShieldIcon,
  TargetIcon,
  UserRoundIcon,
} from 'lucide-react'
import { matchPath } from 'react-router'

import { ROUTES } from '@/shared/config/paths'

export type NavItem = { label: string; to: string; icon: LucideIcon; adminOnly?: boolean }

export type ShellNav = {
  items: NavItem[]
  /** Экраны без нижнего меню */
  focus: string[]
}

// Пять разделов нижнего меню, у администратора шестой (frontend-tz, раздел 6)
export const MINIAPP_NAV: ShellNav = {
  items: [
    { label: 'Сегодня', to: ROUTES.TODAY, icon: TargetIcon },
    { label: 'Программы', to: ROUTES.PROGRAMS, icon: LayersIcon },
    { label: 'Справочник', to: ROUTES.LIBRARY, icon: BookOpenIcon },
    { label: 'Статистика', to: ROUTES.STATS, icon: ChartNoAxesColumnIcon },
    { label: 'Профиль', to: ROUTES.ME, icon: UserRoundIcon },
    { label: 'Админ', to: ROUTES.ADMIN, icon: ShieldIcon, adminOnly: true },
  ],
  // Тренировка и заминка (frontend-tz, раздел 6), первый запуск и вложенные экраны со своей кнопкой «Назад»
  focus: [
    ROUTES.ONBOARDING,
    ROUTES.WORKOUT,
    ROUTES.WORKOUT_REPLACE,
    ROUTES.WORKOUT_SUMMARY,
    ROUTES.COOLDOWN,
    ROUTES.PROGRAM,
    ROUTES.PROGRAM_TEMPLATES,
    ROUTES.PROGRAM_TEMPLATE,
    ROUTES.PROGRAM_ADD_EXERCISE,
    ROUTES.LIBRARY_NEW,
    ROUTES.EXERCISE,
    ROUTES.STRETCH,
    ROUTES.FRIEND,
    ROUTES.ADMIN_REQUEST,
    ROUTES.ADMIN_CATALOG_ITEM,
    ROUTES.ADMIN_TEMPLATE,
    ROUTES.ADMIN_TEMPLATE_ADD_EXERCISE,
  ],
}

export const PREVIEW_NAV: ShellNav = {
  items: [
    { label: 'Сегодня', to: ROUTES.PREVIEW_TODAY, icon: TargetIcon },
    { label: 'Программы', to: ROUTES.PREVIEW_PROGRAMS, icon: LayersIcon },
    { label: 'Справочник', to: ROUTES.PREVIEW_LIBRARY, icon: BookOpenIcon },
    { label: 'Статистика', to: ROUTES.PREVIEW_STATS, icon: ChartNoAxesColumnIcon },
    { label: 'Профиль', to: ROUTES.PREVIEW_PROFILE, icon: UserRoundIcon },
    { label: 'Админ', to: ROUTES.PREVIEW_ADMIN, icon: ShieldIcon, adminOnly: true },
  ],
  focus: [
    ROUTES.PREVIEW_WORKOUT,
    ROUTES.PREVIEW_WORKOUT_REPLACE,
    ROUTES.PREVIEW_COOLDOWN,
    ROUTES.PREVIEW_PROGRAM,
    ROUTES.PREVIEW_PROGRAM_TEMPLATES,
    ROUTES.PREVIEW_PROGRAM_TEMPLATE,
    ROUTES.PREVIEW_PROGRAM_ADD_EXERCISE,
    ROUTES.PREVIEW_LIBRARY_NEW,
    ROUTES.PREVIEW_EXERCISE,
    ROUTES.PREVIEW_STRETCH,
    ROUTES.PREVIEW_FRIEND,
    ROUTES.PREVIEW_ONBOARDING,
    ROUTES.PREVIEW_ENTRY,
    ROUTES.PREVIEW_ADMIN_CATALOG_ITEM,
    ROUTES.PREVIEW_ADMIN_TEMPLATE,
    ROUTES.PREVIEW_ADMIN_MODERATION,
  ],
}

export const isFocusRoute = (nav: ShellNav, pathname: string) => nav.focus.some(pattern => matchPath(pattern, pathname))

/** Корень раздела нижнего меню: на нём системная кнопка «Назад» не нужна */
export const isSectionRoot = (nav: ShellNav, pathname: string) => nav.items.some(item => item.to === pathname)
