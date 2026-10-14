import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { useId } from 'react'

import { cn } from '@/shared/lib/utils'

import { Eyebrow, Poster } from './Typography'

type Point = { label: string; value: number }

type TooltipProps = { active?: boolean; payload?: readonly { payload?: unknown }[]; unit: string }

const formatValue = (v: number) => v.toString().replace('.', ',')

// Больше подписей на узком экране (от 375px) не помещается: даты наезжают друг на друга
const MAX_TICKS = 5

const StepTooltip = ({ active, payload, unit }: TooltipProps) => {
  const p = payload?.[0]?.payload as Point | undefined
  if (!active || !p) return null
  return (
    <div className='bg-background border-foreground/80 border-[1.5px] px-2.5 py-1.5'>
      <Poster>
        {formatValue(p.value)} {unit}
      </Poster>
      <Eyebrow as='p'>{p.label}</Eyebrow>
    </div>
  )
}

type StepChartProps = {
  data: Point[]
  unit: string
  /** Ступенька — рабочий вес держится до следующего прироста; линия — для плавных рядов вроде веса тела */
  curve?: 'step' | 'line'
  /** Минимальный шаг подписей: подписывать каждую n-ю дату. На длинном ряду шаг растёт, чтобы подписей было не больше MAX_TICKS */
  tickEvery?: number
  className?: string
}

// График прогресса: синяя линия и растровая заливка — печатная фактура плаката вместо градиента
export const StepChart = ({ data, unit, curve = 'step', tickEvery = 2, className }: StepChartProps) => {
  const dots = useId().replace(/:/g, '')
  const interval = Math.max(tickEvery, Math.ceil(data.length / MAX_TICKS) - 1)

  return (
    <div className={cn('h-[190px]', className)}>
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{ top: 12, right: 8, bottom: 0, left: 8 }}
        >
          <defs>
            <pattern
              id={dots}
              width='6'
              height='6'
              patternUnits='userSpaceOnUse'
            >
              <circle
                cx='3'
                cy='3'
                r='1.2'
                fill='var(--sb-blue)'
                opacity='0.45'
              />
            </pattern>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke='var(--sb-rule)'
            strokeWidth={1}
          />
          <XAxis
            dataKey='label'
            tickLine={false}
            axisLine={false}
            interval={interval}
            tick={{ fill: 'color-mix(in oklab, var(--sb-ink) 55%, transparent)', fontSize: 11 }}
          />
          <YAxis
            hide
            domain={['dataMin - 4', 'dataMax + 2']}
          />
          <Tooltip
            content={props => (
              <StepTooltip
                {...props}
                unit={unit}
              />
            )}
            cursor={{ stroke: 'var(--sb-ink)', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Area
            type={curve === 'step' ? 'stepAfter' : 'monotone'}
            dataKey='value'
            stroke='var(--sb-blue)'
            strokeWidth={2}
            fill={`url(#${dots})`}
            activeDot={{ r: 5, fill: 'var(--sb-blue)', stroke: 'var(--sb-paper)', strokeWidth: 2 }}
            dot={false}
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
