import { plural } from '@/bot';

/** «4 × 8–12» / «3 × 10». */
export function planText(
  sets: number,
  repsMin: number,
  repsMax: number,
): string {
  return `${sets} × ${repsMin === repsMax ? repsMin : `${repsMin}–${repsMax}`}`;
}

export const exercisesCount = (n: number): string =>
  `${n} ${plural(n, 'упражнение', 'упражнения', 'упражнений')}`;

export const complexesCount = (n: number): string =>
  `${n} ${plural(n, 'комплекс', 'комплекса', 'комплексов')}`;
