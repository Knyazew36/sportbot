import type { ReactNode } from 'react'

import { StepChart } from '@/shared/ui/kit/StepChart'
import { Eyebrow, Poster, Text, Unit } from '@/shared/ui/kit/Typography'

import { StatsSection } from './StatsSection'

type TrendSectionProps = {
  title: string
  aside?: string
  /** Что показывает график */
  note: string
  unit: string
  /** Крупное число над графиком — итог периода */
  headline?: ReactNode
  /** Подпись под крупным числом: что именно за число */
  caption?: ReactNode
  data: { label: string; value: number }[]
  curve?: 'step' | 'line'
  empty: string
}

// Ряд по датам за период страницы: вес тела, посещаемость по неделям (frontend-tz, 12.2)
export const TrendSection = ({
  title,
  aside,
  note,
  unit,
  headline,
  caption,
  data,
  curve = 'line',
  empty,
}: TrendSectionProps) => (
  <StatsSection
    title={title}
    aside={aside}
    note={note}
  >
    <div>
      <Poster
        size='3xl'
        numeric
      >
        {headline ?? '—'}
        <Unit>{unit}</Unit>
      </Poster>
      {caption && (
        <Eyebrow
          as='p'
          className='mt-2'
        >
          {caption}
        </Eyebrow>
      )}
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
  </StatsSection>
)
