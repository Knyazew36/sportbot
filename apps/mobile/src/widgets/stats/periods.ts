import { router, useLocalSearchParams } from 'expo-router';

// Период статистики один на экран — порт widgets/stats/periods.ts: от него зависят прогресс, посещаемость и вес тела.
// Живёт в параметрах экрана (?period=), чтобы пережить переход на страницу упражнения и обратно
export const PERIODS = [
  { value: 'month', label: '1 мес' },
  { value: 'quarter', label: '3 мес' },
  { value: 'year', label: 'Год' },
] as const;
export type Period = (typeof PERIODS)[number]['value'];

export const PERIOD_DAYS: Record<Period, number> = { month: 31, quarter: 92, year: 366 };

/** Период словами для подписей: «за месяц», «за 3 месяца», «за год» */
export const PERIOD_TEXT: Record<Period, string> = { month: 'за месяц', quarter: 'за 3 месяца', year: 'за год' };

const DEFAULT_PERIOD: Period = 'quarter';

const isPeriod = (value: string | undefined): value is Period => PERIODS.some((p) => p.value === value);

/** Период из параметров экрана; setParams не кладёт новый экран в стек — «Назад» не листает периоды */
export const usePeriod = () => {
  const { period: raw } = useLocalSearchParams<{ period?: string }>();
  const period = isPeriod(raw) ? raw : DEFAULT_PERIOD;
  const setPeriod = (next: Period) => router.setParams({ period: next });
  return [period, setPeriod] as const;
};
