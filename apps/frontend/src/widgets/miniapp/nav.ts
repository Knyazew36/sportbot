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

// Пять разделов нижнего меню, у администратора шестой (frontend-tz, раздел 6). Пока Mini App живёт в превью — пути превью
export const NAV: NavItem[] = [
  { label: 'Сегодня', to: ROUTES.PREVIEW_TODAY, icon: TargetIcon },
  { label: 'Программы', to: ROUTES.PREVIEW_PROGRAMS, icon: LayersIcon },
  { label: 'Справочник', to: ROUTES.PREVIEW_LIBRARY, icon: BookOpenIcon },
  { label: 'Статистика', to: ROUTES.PREVIEW_STATS, icon: ChartNoAxesColumnIcon },
  { label: 'Профиль', to: ROUTES.PREVIEW_PROFILE, icon: UserRoundIcon },
  { label: 'Админ', to: ROUTES.PREVIEW_ADMIN, icon: ShieldIcon, adminOnly: true },
]

// Без нижнего меню: тренировка и заминка (frontend-tz, раздел 6), первый запуск, ошибки входа
// и вложенные экраны со своей кнопкой «Назад»
const FOCUS_PATTERNS: string[] = [
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
]

export const isFocusRoute = (pathname: string) => FOCUS_PATTERNS.some(pattern => matchPath(pattern, pathname))
