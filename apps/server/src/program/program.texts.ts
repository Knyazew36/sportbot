import { plural } from '@/bot';
import { rangeText } from '@/catalog/measure';
import type { ExerciseMeasure } from '@/generated/prisma/client';

/** «4 × 8–12» / «3 × 10»; на время — «3 × 30–60 с», «1 × 20 мин». */
export function planText(
  sets: number,
  repsMin: number,
  repsMax: number,
  measure: ExerciseMeasure = 'REPS',
): string {
  return `${sets} × ${rangeText(measure, repsMin, repsMax)}`;
}

/** «🏃 Кардио: беговая дорожка — 30 мин»; кардио в комплексе нет — null. */
export function cardioText(source: {
  cardioName: string | null;
  cardioMinutes: number | null;
}): string | null {
  if (!source.cardioName || !source.cardioMinutes) return null;
  return `🏃 Кардио: ${source.cardioName} — ${source.cardioMinutes} мин`;
}

export const exercisesCount = (n: number): string =>
  `${n} ${plural(n, 'упражнение', 'упражнения', 'упражнений')}`;

export const complexesCount = (n: number): string =>
  `${n} ${plural(n, 'тренировка', 'тренировки', 'тренировок')}`;
