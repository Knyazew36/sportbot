import { useAttendanceWeeks } from '@/shared/local/entities/stats';

import { formatDate } from '@/shared/lib/format';

import { PERIOD_TEXT, type Period } from './periods';
import { TrendSection } from './TrendSection';

const WEEKS: Record<Period, number> = { month: 5, quarter: 13, year: 52 };

// Посещаемость за период — порт widgets/stats/AttendanceSection.tsx: итог крупно, ниже — по неделям.
// userId — статистика друга
export const AttendanceSection = ({ period, userId }: { period: Period; userId?: number }) => {
  const weeks = useAttendanceWeeks(WEEKS[period], userId);
  const list = weeks.data ?? [];
  const done = list.reduce((sum, w) => sum + w.done, 0);
  const planned = list.reduce((sum, w) => sum + w.planned, 0);
  // Выбранная неделя подписана числом тренировок: один процент без «из скольких» ни о чём не говорит
  const data = list.map((w) => ({
    label: `с ${formatDate(w.weekStart, 'd MMM')}`,
    title: `неделя с ${formatDate(w.weekStart, 'd MMM')} · ${w.done} из ${w.planned} тренировок`,
    value: w.percent,
  }));

  return (
    <TrendSection
      title="Посещаемость"
      aside={PERIOD_TEXT[period]}
      note="Сколько тренировок по расписанию сделано. Дни на паузе не считаются. График — по неделям."
      unit="%"
      headline={planned ? Math.min(100, Math.round((done / planned) * 100)) : undefined}
      caption={planned ? `${done} из ${planned} тренировок` : undefined}
      data={data}
      curve="step"
      hint="нажми на неделю"
      empty="Пока мало недель для графика."
    />
  );
};
