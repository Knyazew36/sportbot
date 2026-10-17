import type { StatsExerciseResponseDtoUnit } from '@/shared/api/generated/model'

export type ProgressUnit = StatsExerciseResponseDtoUnit

// Прогресс считается в кг, у упражнений без веса (брусья, подтягивания) — в повторах,
// у упражнений на время (планка, кардио) — в секундах. Решает бэк
export const PROGRESS_UNIT: Record<ProgressUnit, { short: string; aside: string }> = {
  kg: { short: 'кг', aside: 'лучший вес за тренировку' },
  reps: { short: 'повт.', aside: 'лучший подход по повторам' },
  sec: { short: 'с', aside: 'лучшее время подхода' },
  min: { short: 'мин', aside: 'лучшее время подхода' },
}
