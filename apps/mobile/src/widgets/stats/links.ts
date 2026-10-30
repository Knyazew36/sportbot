import { routeHref, ROUTES, type RoutePath } from '@/shared/config/routes';

import type { Period } from './periods';

export type StatsTab = 'muscles' | 'attendance';

type StatsLinkParams = { userId?: number; period?: Period; muscle?: number; tab?: StatsTab };

// Ссылки экранов статистики — порт widgets/stats/links.ts

/** Экран статистики с userId друга, периодом и фильтром мышцы — пустые параметры не пишем */
export const statsLink = (path: RoutePath, params: StatsLinkParams = {}, pathParams: Record<string, number> = {}) =>
  routeHref(path, { ...pathParams, ...params });

/** Посещения и календарь — вкладка статистики; на неё ведут ссылки с главной */
export const ATTENDANCE_LINK = statsLink(ROUTES.STATS, { tab: 'attendance' });

export const exerciseStatsLink = (exerciseId: number, params?: StatsLinkParams) =>
  statsLink(ROUTES.STATS_EXERCISE, params, { exerciseId });

/** Откуда пришли на экраны статистики: своя статистика (на нужной вкладке) или профиль друга */
export const statsHome = (userId?: number, period?: Period, tab?: StatsTab) => {
  if (userId) return routeHref(ROUTES.FRIEND, { friendId: userId });
  return statsLink(ROUTES.STATS, { period, tab });
};
