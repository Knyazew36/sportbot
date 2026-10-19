import { zonedParts } from '@/common/utils';

/**
 * Даты без времени (`@db.Date`) хранятся как полночь UTC с календарным днём пользователя.
 * Все функции ниже работают с такими датами: арифметика — в UTC, без влияния пояса сервера.
 */

const DAY_MS = 86_400_000;

export const WEEKDAY_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
/** Порядок показа дней недели: с понедельника. */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const MONTHS_GEN = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/** Сегодняшний календарный день пользователя. */
export function localToday(timeZone: string, now = new Date()): Date {
  const { year, month, day } = zonedParts(now, timeZone);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Минуты от полуночи по часам пользователя. */
export function localMinutes(timeZone: string, now = new Date()): number {
  const { hour, minute } = zonedParts(now, timeZone);
  return hour * 60 + minute;
}

export function hhmmToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / DAY_MS);
}

/** День недели даты: 0 — воскресенье. */
export const weekdayOf = (date: Date): number => date.getUTCDay();

/** Понедельник недели, в которую попадает дата. */
export function weekStart(date: Date): Date {
  return addDays(date, -((weekdayOf(date) + 6) % 7));
}

export function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** «5 октября». */
export function fmtDay(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS_GEN[date.getUTCMonth()]}`;
}

/** «пн 05.10». */
export function fmtShort(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${WEEKDAY_SHORT[weekdayOf(date)]} ${dd}.${mm}`;
}

/** «5–11 октября» / «28 сентября – 4 октября». */
export function fmtRange(from: Date, to: Date): string {
  return from.getUTCMonth() === to.getUTCMonth()
    ? `${from.getUTCDate()}–${fmtDay(to)}`
    : `${fmtDay(from)} – ${fmtDay(to)}`;
}

/**
 * Дата из ввода пользователя: «25.10», «25.10.2026», «25 10». Год не указан — ближайшая будущая.
 * null — не распознано или дата не существует.
 */
export function parseUserDate(text: string, today: Date): Date | null {
  const match = /^\s*(\d{1,2})[.\s/-](\d{1,2})(?:[.\s/-](\d{2,4}))?\s*$/.exec(
    text,
  );
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = match[3] ? Number(match[3]) : today.getUTCFullYear();
  if (year < 100) year += 2000;
  const build = (y: number) => {
    const date = new Date(Date.UTC(y, month - 1, day));
    return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
      ? date
      : null;
  };
  let date = build(year);
  if (date && !match[3] && date < today) date = build(year + 1);
  return date;
}

/**
 * «ЧЧ:ММ» из ввода «8», «8:30», «08.30», «0830», «8,30», «8-30», «в 8», «8ч», «8 вечера».
 * null — не распознано.
 */
export function parseUserTime(text: string): string | null {
  // Запятая и дефис — с телефонной клавиатуры, «в» и точка в конце — из живой речи
  const match =
    /^(?:в\s*)?(\d{1,2})(?:\s*[:.,\-\s]?\s*(\d{2}))?\s*(?:ч|час|часа|часов)?\s*(утра|дня|вечера|ночи)?$/.exec(
      text
        .trim()
        .toLowerCase()
        .replace(/[.!]+$/, '')
        .trim(),
    );
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  if ((match[3] === 'дня' || match[3] === 'вечера') && hour < 12) hour += 12;
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
