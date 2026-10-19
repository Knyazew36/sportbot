import { useState } from 'react'

import { useBodyWeightStats } from '@/entities/stats'
import { formatDate } from '@/shared/lib/format'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { StepChart } from '@/shared/ui/kit/StepChart'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { PERIOD_DAYS, PERIOD_TEXT, PERIODS, type Period } from '@/widgets/stats/periods'

const num = (value: number) => value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })

// График веса тела рядом с его записью: это про тело, а не про тренировки, поэтому в профиле, а не в статистике
export const BodyWeightChart = () => {
  const [period, setPeriod] = useState<Period>('quarter')
  const weights = useBodyWeightStats(PERIOD_DAYS[period])
  const points = weights.data ?? []
  const change = points.length > 1 ? points.at(-1)!.value - points[0]!.value : null

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Eyebrow>
          {change == null
            ? 'изменение'
            : `${change > 0 ? '+' : change < 0 ? '−' : '±'}${num(Math.abs(change))} кг ${PERIOD_TEXT[period]}`}
        </Eyebrow>
        <Segmented
          options={PERIODS}
          value={period}
          onValueChange={setPeriod}
        />
      </div>
      {points.length > 1 ? (
        <StepChart
          data={points.map(p => ({ label: formatDate(p.date, 'd MMM'), value: p.value }))}
          unit='кг'
          curve='line'
          className='-mx-2'
        />
      ) : (
        <Text
          size='sm'
          tone='muted'
        >
          Для графика нужно хотя бы две записи веса за период.
        </Text>
      )}
    </div>
  )
}
