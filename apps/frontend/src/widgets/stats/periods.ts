// Период графиков статистики: точки старше границы не показываем
export const PERIODS = ['1 мес', '3 мес', 'Год'] as const
export type Period = (typeof PERIODS)[number]

export const PERIOD_DAYS: Record<Period, number> = { '1 мес': 31, '3 мес': 92, Год: 366 }

/** Точки за последние N дней периода */
export const withinPeriod = <T extends { date: string }>(points: T[], period: Period) => {
  const from = Date.now() - PERIOD_DAYS[period] * 86_400_000
  return points.filter(p => new Date(p.date).getTime() >= from)
}
