import { useState } from 'react'

import { useProgress, useProgressExercises } from '@/entities/stats'
import { formatDate } from '@/shared/lib/format'

import { type Period, withinPeriod } from './periods'
import { WeightProgress } from './WeightProgress'

// Прогресс по выбранному упражнению (frontend-tz, 12.2): в кг, без веса — в повторах. Нет упражнений с подходами — блока нет
export const ProgressSection = ({ userId }: { userId?: number }) => {
  const exercises = useProgressExercises(userId)
  const [picked, setPicked] = useState<number | null>(null)
  const [period, setPeriod] = useState<Period>('3 мес')
  const exercise = exercises.data?.find(e => e.id === picked) ?? exercises.data?.[0]
  const exerciseId = exercise?.id
  const progress = useProgress(exerciseId, userId)

  if (!exercises.data?.length || !exercise) return null

  return (
    <WeightProgress
      unit={exercise.unit}
      exercises={exercises.data.map(e => ({ value: String(e.id), label: e.name }))}
      exercise={String(exerciseId)}
      onExerciseChange={v => setPicked(Number(v))}
      period={period}
      onPeriodChange={setPeriod}
      data={withinPeriod(progress.data ?? [], period).map(p => ({
        label: formatDate(p.date, 'd MMM'),
        value: p.value,
      }))}
    />
  )
}
