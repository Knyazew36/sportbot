/**
 * Время в часовом поясе бизнеса, а не сервера. Прод-сервер живёт в UTC, а клиенты — в России: без этого
 * сводка «в 19:00» уходила в 22:00 по Москве, а «сегодня с 00:00» начиналось в 03:00.
 * Часового пояса организации пока нет — пояс один на всё приложение (APP_TIMEZONE).
 */
export const DEFAULT_TIME_ZONE = 'Europe/Moscow';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** 0 — воскресенье, как Date.getDay() */
  weekday: number;
}

export function appTimeZone(): string {
  return process.env.APP_TIMEZONE || DEFAULT_TIME_ZONE;
}

export function zonedParts(date: Date, timeZone = appTimeZone()): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    // h23 — иначе полночь в части сред выходит как «24»
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    weekday: WEEKDAYS.indexOf(get('weekday')),
  };
}

/** Полночь того же дня в поясе timeZone, как абсолютный момент. */
export function startOfZonedDay(date: Date, timeZone = appTimeZone()): Date {
  const { year, month, day } = zonedParts(date, timeZone);
  const midnightAsUtc = Date.UTC(year, month - 1, day);
  const guess = new Date(midnightAsUtc - offsetMs(date, timeZone));
  // Смещение берём ещё раз уже у самой полуночи — в поясах с переходом на летнее время оно могло смениться за день
  return new Date(midnightAsUtc - offsetMs(guess, timeZone));
}

export function formatZonedTime(date: Date, timeZone = appTimeZone()): string {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
}

export function formatZonedDate(
  date: Date,
  options: Intl.DateTimeFormatOptions,
  timeZone = appTimeZone(),
): string {
  return date.toLocaleDateString('ru-RU', { ...options, timeZone });
}

function offsetMs(date: Date, timeZone: string): number {
  const { year, month, day, hour, minute } = zonedParts(date, timeZone);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  return wallClockAsUtc - Math.floor(date.getTime() / 60_000) * 60_000;
}
