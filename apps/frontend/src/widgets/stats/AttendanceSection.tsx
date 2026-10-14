import { useState } from 'react'

import { useAttendanceWeeks } from '@/entities/stats'
import { formatDate } from '@/shared/lib/format'

import type { Period } from './periods'
import { TrendSection } from './TrendSection'

const WEEKS: Record<Period, number> = { '1 мес': 5, '3 мес': 13, Год: 52 }

// Посещаемость по неделям, % (frontend-tz, 12.2). userId — статистика друга
export const AttendanceSection = ({ userId }: { userId?: number }) => {
  const [period, setPeriod] = useState<Period>('3 мес')
  const weeks = useAttendanceWeeks(WEEKS[period], userId)
  const data = (weeks.data ?? []).map(w => ({ label: `с ${formatDate(w.weekStart, 'd MMM')}`, value: w.percent }))

  return (
    <TrendSection
      title='Посещаемость'
      aside='по неделям'
      unit='%'
      headline={data.at(-1)?.value}
      period={period}
      onPeriodChange={setPeriod}
      data={data}
      curve='step'
      empty='Пока мало недель для графика.'
    />
  )
}
