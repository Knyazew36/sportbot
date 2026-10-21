import { Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { useId, useState } from 'react'

import { PointerIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { haptic } from '@/shared/miniapp'

import { Eyebrow, Poster } from './Typography'

type Point = {
  /** Подпись на оси: «21 окт.» */
  label: string
  /** Подпись выбранной точки, если нужна длиннее оси: «21 октября». По умолчанию — label */
  title?: string
  value: number
}

const defaultFormat = (v: number) => v.toString().replace('.', ',')

// Больше подписей на узком экране (от 375px) не помещается: даты наезжают друг на друга
const MAX_TICKS = 5

// На длинном ряду точки сливаются в сплошную полосу и только мешают линии
const MAX_DOTS = 40

// Какие даты подписать: первая и последняя всегда, между ними — равномерно, не больше MAX_TICKS
const tickIndexes = (count: number) => {
  if (count <= MAX_TICKS) return new Set(Array.from({ length: count }, (_, i) => i))
  return new Set(Array.from({ length: MAX_TICKS }, (_, i) => Math.round((i * (count - 1)) / (MAX_TICKS - 1))))
}

type TickProps = {
  x?: number | string
  y?: number | string
  index?: number
  payload?: { value?: unknown }
}

type StepChartProps = {
  data: Point[]
  unit: string
  /** Как писать значение: для времени — «1:51», а не «111» */
  format?: (value: number) => string
  /** Ступенька — рабочий вес держится до следующего прироста; линия — для плавных рядов вроде веса тела */
  curve?: 'step' | 'line'
  className?: string
}

// График прогресса: синяя линия и растровая заливка — печатная фактура плаката вместо градиента.
// Значение дня — строкой над графиком, а не всплывашкой: всплывашка у краёв уезжает за график.
// Пока день не выбран, строка показывает последний и подсказывает, что точки нажимаются
export const StepChart = ({ data, unit, format = defaultFormat, curve = 'step', className }: StepChartProps) => {
  const dots = useId().replace(/:/g, '')
  const [picked, setPicked] = useState<number | null>(null)
  const last = data.length - 1
  const index = picked != null && picked <= last ? picked : last
  const point = data[index]
  const ticks = tickIndexes(data.length)
  // Ось по номеру точки, а не по подписи: у двух точек может совпасть дата, и по подписи они слипнутся
  const rows = data.map((p, i) => ({ ...p, i }))

  const pick = (next: number | string | null | undefined) => {
    const i = Number(next)
    if (next == null || Number.isNaN(i) || i === picked) return
    haptic.select()
    setPicked(i)
  }

  // Подпись даты по центру точки обрезается краем графика у первой и последней точки — их прижимаем внутрь
  const EdgeTick = ({ x = 0, y = 0, index: i = 0, payload }: TickProps) => {
    if (!ticks.has(i)) return null
    const anchor = i === 0 ? 'start' : i === last ? 'end' : 'middle'
    return (
      <text
        x={Number(x)}
        y={Number(y)}
        dy={12}
        textAnchor={anchor}
        fontSize={11}
        fill='color-mix(in oklab, var(--sb-ink) 55%, transparent)'
      >
        {data[Number(payload?.value)]?.label ?? ''}
      </text>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className='flex min-h-11 items-end justify-between gap-3 px-2'>
        {point && (
          <div className='min-w-0'>
            <Poster
              size='md'
              numeric
            >
              {format(point.value)}
              {unit && ` ${unit}`}
            </Poster>
            <Eyebrow as='p'>
              {picked == null ? 'последняя · ' : ''}
              {point.title ?? point.label}
            </Eyebrow>
          </div>
        )}
        {picked == null && (
          <Eyebrow
            tone='primary'
            className='flex shrink-0 items-center gap-1'
          >
            <PointerIcon className='size-3.5' />
            нажми на день
          </Eyebrow>
        )}
      </div>
      <div className='h-[190px]'>
        <ResponsiveContainer>
          <AreaChart
            data={rows}
            margin={{ top: 12, right: 8, bottom: 0, left: 8 }}
            onClick={s => pick(s.activeTooltipIndex)}
            onMouseMove={s => s.isTooltipActive && pick(s.activeTooltipIndex)}
            className='cursor-pointer outline-none [&_*]:outline-none'
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
              dataKey='i'
              tickLine={false}
              axisLine={false}
              interval={0}
              // Отступ по краям, чтобы крайние точки не резались, а у ступеньки было видно последнее значение
              padding={{ left: 6, right: 6 }}
              tick={EdgeTick}
            />
            <YAxis
              hide
              domain={['dataMin - 4', 'dataMax + 2']}
            />
            {/* Всплывашка не нужна, но без Tooltip график не сообщает, какая точка под пальцем */}
            <Tooltip
              content={() => null}
              cursor={false}
            />
            <Area
              // Ступенька с центром на точке: у каждого дня своя площадка, последний не схлопывается в черту у края
              type={curve === 'step' ? 'step' : 'monotone'}
              dataKey='value'
              stroke='var(--sb-blue)'
              strokeWidth={2}
              fill={`url(#${dots})`}
              dot={
                data.length <= MAX_DOTS
                  ? { r: 3, fill: 'var(--sb-blue)', stroke: 'var(--sb-paper)', strokeWidth: 1.5 }
                  : false
              }
              activeDot={false}
              animationDuration={1200}
            />
            {point && (
              <ReferenceLine
                x={index}
                stroke='var(--sb-ink)'
                strokeWidth={1}
                strokeDasharray='3 3'
              />
            )}
            {point && (
              <ReferenceDot
                x={index}
                y={point.value}
                r={6}
                fill='var(--sb-blue)'
                stroke='var(--sb-paper)'
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
