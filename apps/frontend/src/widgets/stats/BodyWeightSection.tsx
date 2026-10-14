import { useState } from 'react'

import { useBodyWeightStats } from '@/entities/stats'
import { formatDate } from '@/shared/lib/format'

import { PERIOD_DAYS, type Period } from './periods'
import { TrendSection } from './TrendSection'

// Вес тела по датам (frontend-tz, 12.2). Только свой: другу вес тела не виден (business-tz, 10.1)
export const BodyWeightSection = () => {
  const [period, setPeriod] = useState<Period>('3 мес')
  const weights = useBodyWeightStats(PERIOD_DAYS[period])
  const data = (weights.data ?? []).map(p => ({ label: formatDate(p.date, 'd MMM'), value: p.value }))

  return (
    <TrendSection
      title='Вес тела'
      unit='кг'
      headline={data.at(-1)?.value.toString().replace('.', ',')}
      period={period}
      onPeriodChange={setPeriod}
      data={data}
      empty='Записей веса пока мало. Добавить вес — в профиле или ответом боту.'
    />
  )
}
