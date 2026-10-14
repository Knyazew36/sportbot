import { useState } from 'react'

import { useProgress, useProgressExercises } from '@/entities/stats'
import { formatDate } from '@/shared/lib/format'

import { type Period, withinPeriod } from './periods'
import { WeightProgress } from './WeightProgress'

// Прогресс весов по выбранному упражнению (frontend-tz, 12.2). Нет упражнений с весами — блока нет
export const ProgressSection = ({ userId }: { userId?: number }) => {
  const exercises = useProgressExercises(userId)
  const [picked, setPicked] = useState<number | null>(null)
  const [period, setPeriod] = useState<Period>('3 мес')
  const exerciseId = picked ?? exercises.data?.[0]?.id
  const progress = useProgress(exerciseId, userId)

  if (!exercises.data?.length || exerciseId == null) return null

  return (
    <WeightProgress
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
