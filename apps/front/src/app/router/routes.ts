import type { ComponentType } from 'react'
import { ROUTES } from '@/shared/config/paths'
import NotFoundPage from '@/pages/not-found/NotFoundPage'

// Либо страница грузится сразу (Component), либо отдельным чанком при первом переходе (lazy)
export type AppRoute = { path: string } & (
  | { Component: ComponentType; lazy?: never }
  | { lazy: () => Promise<{ default: ComponentType }>; Component?: never }
)

const soon = () => import('@/pages/soon/SoonPage')

// ── Кабинет: внутри оболочки AppShell (/app/:orgId/*) ───────────────────────
export const appRoutes: AppRoute[] = [
  { path: ROUTES.TODAY, lazy: () => import('@/pages/today/TodayPage') },
  { path: ROUTES.MONEY, lazy: soon },
  { path: ROUTES.NOTIFICATIONS, lazy: soon },
  { path: ROUTES.SETTINGS, lazy: soon },
  { path: ROUTES.HELP, lazy: soon },
  { path: ROUTES.SPECIALISTS, lazy: soon },
  { path: ROUTES.PROFILE, lazy: soon },
]

// ── Приватные вне оболочки кабинета ─────────────────────────────────────────
export const privateRoutes: AppRoute[] = []

// ── Гостевые: только без входа, иначе редирект на главную ───────────────────
export const guestRoutes: AppRoute[] = [{ path: ROUTES.LOGIN, lazy: () => import('@/pages/login/LoginPage') }]

// ── Публичные: доступны всем ────────────────────────────────────────────────
export const publicRoutes: AppRoute[] = [
  { path: ROUTES.UI, lazy: () => import('@/pages/ui/UiPage') },
  { path: ROUTES.PAGES, lazy: () => import('@/pages/pages-index/PagesIndexPage') },
  // 404 грузим сразу: страница крошечная, отдельный чанк не окупается
  { path: '*', Component: NotFoundPage },
]
