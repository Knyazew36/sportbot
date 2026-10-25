import { addDays, isSameMonth } from 'date-fns';

import type { DayToday } from '@sportbot/api/entities/day';

import { formatDate } from '@/shared/lib/format';
import type { DayMark } from '@/widgets/stats/marks';

// У недели с главной свои отметки: план и отдых вместо «будущего»
export const TODAY_MARK: Record<DayToday['week'][number]['mark'], DayMark> = {
  DONE: 'done',
  MISSED: 'skip',
  PAUSED: 'pause',
  PLAN: 'future',
  REST: 'rest',
};

export const weekTitle = (offset: number, monday: Date) => {
  if (offset === 0) return 'Эта неделя';
  const sunday = addDays(monday, 6);
  return isSameMonth(monday, sunday)
    ? `${formatDate(monday, 'd')}–${formatDate(sunday, 'd MMM')}`
    : `${formatDate(monday, 'd MMM')} – ${formatDate(sunday, 'd MMM')}`;
};

export const workoutsText = (count: number) => {
  if (!count) return 'без тренировок';
  const tail = count % 100;
  if (count % 10 === 1 && tail !== 11) return `${count} тренировка`;
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(tail)) return `${count} тренировки`;
  return `${count} тренировок`;
};
