import type { StatsExerciseResponseDtoUnit } from '@/shared/api/generated/model'

export type ProgressUnit = StatsExerciseResponseDtoUnit

// Прогресс считается в кг, а у упражнений без веса (брусья, подтягивания) — в повторах. Решает бэк
export const PROGRESS_UNIT: Record<ProgressUnit, { short: string; aside: string }> = {
  kg: { short: 'кг', aside: 'лучший вес за тренировку' },
  reps: { short: 'повт.', aside: 'лучший подход по повторам' },
}
