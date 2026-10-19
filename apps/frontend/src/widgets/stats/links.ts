import { buildPath, ROUTES } from '@/shared/config/paths'

import type { Period } from './periods'

type StatsLinkParams = { userId?: number; period?: Period; muscle?: number }

/** Адрес экрана статистики с userId друга, периодом и фильтром мышцы — пустые параметры не пишем */
export const statsLink = (path: string, { userId, period, muscle }: StatsLinkParams = {}) => {
  const params = new URLSearchParams()
  if (userId) params.set('userId', String(userId))
  if (period) params.set('period', period)
  if (muscle) params.set('muscle', String(muscle))
  const search = params.toString()
  return search ? `${path}?${search}` : path
}

export const exerciseStatsLink = (exerciseId: number, params?: StatsLinkParams) =>
  statsLink(buildPath(ROUTES.STATS_EXERCISE, { exerciseId }), params)

/** Откуда пришли на экраны статистики: своя статистика или профиль друга */
export const statsHome = (userId?: number, period?: Period) =>
  userId ? buildPath(ROUTES.FRIEND, { friendId: userId }) : statsLink(ROUTES.STATS, { period })
