import { buildPath, ROUTES } from '@/shared/config/paths'

import type { Period } from './periods'

export type StatsTab = 'muscles' | 'attendance'

type StatsLinkParams = { userId?: number; period?: Period; muscle?: number; tab?: StatsTab }

/** Адрес экрана статистики с userId друга, периодом и фильтром мышцы — пустые параметры не пишем */
export const statsLink = (path: string, { userId, period, muscle, tab }: StatsLinkParams = {}) => {
  const params = new URLSearchParams()
  if (userId) params.set('userId', String(userId))
  if (period) params.set('period', period)
  if (muscle) params.set('muscle', String(muscle))
  if (tab) params.set('tab', tab)
  const search = params.toString()
  return search ? `${path}?${search}` : path
}

/** Посещения и календарь — вкладка статистики; на неё ведут ссылки с главной */
export const ATTENDANCE_LINK = statsLink(ROUTES.STATS, { tab: 'attendance' })

export const exerciseStatsLink = (exerciseId: number, params?: StatsLinkParams) =>
  statsLink(buildPath(ROUTES.STATS_EXERCISE, { exerciseId }), params)

/** Откуда пришли на экраны статистики: своя статистика (на нужной вкладке) или профиль друга */
export const statsHome = (userId?: number, period?: Period, tab?: StatsTab) =>
  userId ? buildPath(ROUTES.FRIEND, { friendId: userId }) : statsLink(ROUTES.STATS, { period, tab })
