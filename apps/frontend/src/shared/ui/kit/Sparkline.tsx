import { cn } from '@/shared/lib/utils'

type SparklineProps = {
  values: number[]
  className?: string
}

// Мини-график в строку списка: только форма ряда, без осей. Цвет — от текста (text-*)
export const Sparkline = ({ values, className }: SparklineProps) => {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const range = Math.max(...values) - min
  // Ряд без изменений — по центру: прижатая к низу линия читается как спад
  const y = (v: number) => (range ? 18 - ((v - min) / range) * 16 : 10)
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${y(v)}`).join(' ')

  return (
    <svg
      viewBox='0 0 100 20'
      preserveAspectRatio='none'
      aria-hidden
      className={cn('h-5 w-14 overflow-visible', className)}
    >
      <polyline
        points={points}
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinejoin='round'
        vectorEffect='non-scaling-stroke'
      />
    </svg>
  )
}
