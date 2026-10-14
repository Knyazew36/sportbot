import type { ReactNode } from 'react'

import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { StepChart } from '@/shared/ui/kit/StepChart'
import { Poster, Text, Unit } from '@/shared/ui/kit/Typography'

import { PERIODS, type Period } from './periods'

type TrendSectionProps = {
  title: string
  aside?: string
  unit: string
  /** Крупное число над графиком: последнее значение */
  headline?: ReactNode
  period: Period
  onPeriodChange: (period: Period) => void
  data: { label: string; value: number }[]
  curve?: 'step' | 'line'
  empty: string
}

// Ряд по датам с переключением периода: вес тела, посещаемость по неделям (frontend-tz, 12.2)
export const TrendSection = ({
  title,
  aside,
  unit,
  headline,
  period,
  onPeriodChange,
  data,
  curve = 'line',
  empty,
}: TrendSectionProps) => (
  <ScreenSection
    title={title}
    aside={aside}
  >
    <div className='flex flex-wrap items-end justify-between gap-3'>
      <Poster
        size='3xl'
        numeric
      >
        {headline ?? '—'}
        <Unit>{unit}</Unit>
      </Poster>
      <Segmented
        options={PERIODS}
        value={period}
        onValueChange={onPeriodChange}
      />
    </div>
    {data.length > 1 ? (
      <StepChart
        data={data}
        unit={unit}
        curve={curve}
        className='-mx-2'
      />
    ) : (
      <Text
        size='sm'
        tone='muted'
      >
        {empty}
      </Text>
    )}
  </ScreenSection>
)
