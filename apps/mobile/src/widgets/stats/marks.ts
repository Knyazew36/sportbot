import type { CalendarMark } from '@sportbot/api/generated/model';

// Отметки дней календаря тренировок и их подписи — порт widgets/stats/marks.ts
export type DayMark = 'done' | 'skip' | 'pause' | 'moved' | 'pending' | 'rest' | 'future';

/** Отметка дня из API — в отметку клетки календаря */
export const DAY_MARK: Record<CalendarMark, DayMark> = {
  DONE: 'done',
  MISSED: 'skip',
  PAUSED: 'pause',
  RESCHEDULED: 'moved',
  PENDING: 'pending',
  REST: 'rest',
  FUTURE: 'future',
};

export const MARK_LABEL: Record<DayMark, string> = {
  done: 'Тренировка',
  skip: 'Пропуск',
  pause: 'Пауза',
  moved: 'Перенос',
  pending: 'Ждёт ответа',
  rest: 'Отдых',
  future: 'По плану',
};
