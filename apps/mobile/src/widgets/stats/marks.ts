import type { CalendarMark } from '@sportbot/api/generated/model';

// Отметки дней календаря тренировок и их подписи — порт widgets/stats/marks.ts
export type DayMark = 'done' | 'skip' | 'pause' | 'plan' | 'rest';

/** Отметка дня из API — в отметку клетки календаря */
export const DAY_MARK: Record<CalendarMark, DayMark> = {
  DONE: 'done',
  MISSED: 'skip',
  PAUSED: 'pause',
  PLAN: 'plan',
  REST: 'rest',
};

export const MARK_LABEL: Record<DayMark, string> = {
  done: 'Тренировка',
  skip: 'Пропуск',
  pause: 'Пауза',
  plan: 'Тренировочный день',
  rest: 'Отдых',
};
