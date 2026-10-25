import { pluralize } from '@front-cmdt/utils/pluralize';

import type { DayToday } from '@sportbot/api/entities/day';

import { DAY_FORMS } from '@/shared/lib/plural-forms';

const MILESTONES = [7, 14, 30, 50, 100, 365];

/** Подпись под серией: первая подходящая — первая тренировка, веха, рекорд серии, сколько до него */
export const streakNote = ({ current, best }: DayToday['streak']) => {
  if (best === 1) return 'первая тренировка — серия началась';
  if (MILESTONES.includes(current)) return `${pluralize(current, DAY_FORMS)} подряд — веха!`;
  if (current >= best && current > 1) return 'новый рекорд серии';
  return `до рекорда серии — ${pluralize(best - current, DAY_FORMS)}`;
};
