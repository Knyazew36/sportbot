import { plural } from '@/bot';

/** «4 × 8–12» / «3 × 10». */
export function planText(
  sets: number,
  repsMin: number,
  repsMax: number,
): string {
  return `${sets} × ${repsMin === repsMax ? repsMin : `${repsMin}–${repsMax}`}`;
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
  `${n} ${plural(n, 'комплекс', 'комплекса', 'комплексов')}`;
