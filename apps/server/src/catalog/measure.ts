import type { ExerciseMeasure } from '@/generated/prisma/client';

/**
 * Мера упражнения. REPS — подходы × повторы × вес. TIME и MINUTES — на время: в плане
 * (repsMin/repsMax) и в подходе (reps) лежат секунды, вес не пишется. TIME — удержания (планка),
 * вводятся секундами; MINUTES — кардио (дорожка, скакалка), вводятся минутами одним числом.
 */

/** Упражнение на время: в reps — секунды. */
export const isTimed = (measure: ExerciseMeasure): boolean =>
  measure === 'TIME' || measure === 'MINUTES';

/** Границы плана и подхода: повторы — как раньше, время — до 4 часов. */
export const MEASURE_LIMITS: Record<
  ExerciseMeasure,
  { plan: number; set: number }
> = {
  REPS: { plan: 200, set: 999 },
  TIME: { plan: 14_400, set: 14_400 },
  MINUTES: { plan: 14_400, set: 14_400 },
};

/** План нового упражнения в комплексе: силовое 3 × 8–12, удержание 3 × 30–60 с, кардио 1 × 20 мин. */
export const defaultPlan = (measure: ExerciseMeasure) =>
  measure === 'MINUTES'
    ? { sets: 1, repsMin: 1200, repsMax: 1200 }
    : measure === 'TIME'
      ? { sets: 3, repsMin: 30, repsMax: 60 }
      : { sets: 3, repsMin: 8, repsMax: 12 };

const pad = (n: number) => String(n).padStart(2, '0');
const clock = (s: number) => `${Math.floor(s / 60)}:${pad(s % 60)}`;

/** «45 с», «20 мин», «1:30». */
export function durationText(seconds: number): string {
  if (seconds < 60) return `${seconds} с`;
  if (seconds % 60 === 0) return `${seconds / 60} мин`;
  return clock(seconds);
}

/** Диапазон плана: «8–12», «30–60 с», «20 мин», «1:00–1:30». */
export function rangeText(
  measure: ExerciseMeasure,
  min: number,
  max: number,
): string {
  if (!isTimed(measure)) return min === max ? `${min}` : `${min}–${max}`;
  if (min === max) return durationText(min);
  // Обе границы в минутах или обе меньше двух минут — одна единица на весь диапазон
  if (min % 60 === 0 && max % 60 === 0) return `${min / 60}–${max / 60} мин`;
  if (max < 120) return `${min}–${max} с`;
  return `${clock(min)}–${clock(max)}`;
}

/** Время из ввода: «45» — секунды, «1:30» — минуты и секунды. null — не разобрать. */
export function parseDuration(input: string): number | null {
  const match = /^\s*(?:(\d{1,3}):([0-5]\d)|(\d{1,5}))\s*$/.exec(input);
  if (!match) return null;
  return match[3] !== undefined
    ? Number(match[3])
    : Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Время из ввода по мере: у кардио число — минуты («20»), у удержания — секунды («45»);
 * «мм:сс» понимают обе. @returns секунды; null — не разобрать.
 */
export function parseTime(measure: ExerciseMeasure, input: string): number | null {
  if (measure === 'MINUTES' && /^\s*\d{1,3}\s*$/.test(input))
    return Number(input) * 60;
  return parseDuration(input);
}
