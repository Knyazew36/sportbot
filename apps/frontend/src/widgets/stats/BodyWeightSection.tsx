import { useBodyWeightStats } from '@/entities/stats'
import { formatDate } from '@/shared/lib/format'

import { PERIOD_DAYS, PERIOD_TEXT, type Period } from './periods'
import { TrendSection } from './TrendSection'

const num = (value: number) => value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })

// Вес тела по датам (frontend-tz, 12.2). Только свой: другу вес тела не виден (business-tz, 10.1)
export const BodyWeightSection = ({ period }: { period: Period }) => {
  const weights = useBodyWeightStats(PERIOD_DAYS[period])
  const points = weights.data ?? []
  const data = points.map(p => ({ label: formatDate(p.date, 'd MMM'), value: p.value }))
  const change = points.length > 1 ? points.at(-1)!.value - points[0]!.value : null

  return (
    <TrendSection
      title='Вес тела'
      aside={PERIOD_TEXT[period]}
      note='Записи веса за период. Число — последняя запись, ниже — изменение с начала периода.'
      unit='кг'
      headline={points.length ? num(points.at(-1)!.value) : undefined}
      caption={change != null && `${change > 0 ? '+' : change < 0 ? '−' : '±'}${num(Math.abs(change))} кг ${PERIOD_TEXT[period]}`}
      data={data}
      empty='Записей веса пока мало. Добавить вес — в профиле или ответом боту.'
    />
  )
}
