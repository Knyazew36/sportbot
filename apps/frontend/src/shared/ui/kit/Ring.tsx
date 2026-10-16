import { cn } from '@/shared/lib/utils'

type RingProps = {
  /** Доля оставшегося времени 0..1 */
  value: number
  size?: number
  stroke?: number
  track?: string
  bar?: string
  ticks?: boolean
  /** Длительность перехода между значениями — под частоту обновления, иначе кольцо отстаёт от цифр */
  transitionMs?: number
  className?: string
}

// Кольцо таймера с делениями, как циферблат секундомера
export const Ring = ({
  value,
  size = 240,
  stroke = 6,
  track = 'var(--sb-rule)',
  bar = 'var(--sb-blue)',
  ticks = true,
  transitionMs = 1000,
  className,
}: RingProps) => {
  const r = size / 2 - stroke - 10
  const c = 2 * Math.PI * r
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('-rotate-90', className)}
      aria-hidden
    >
      {ticks &&
        Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * Math.PI * 2
          const long = i % 5 === 0
          const r1 = size / 2 - 2
          const r2 = r1 - (long ? 7 : 3.5)
          return (
            <line
              key={i}
              x1={size / 2 + Math.cos(a) * r1}
              y1={size / 2 + Math.sin(a) * r1}
              x2={size / 2 + Math.cos(a) * r2}
              y2={size / 2 + Math.sin(a) * r2}
              stroke={track}
              strokeWidth={long ? 1.5 : 1}
            />
          )
        })}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill='none'
        stroke={track}
        strokeWidth={stroke}
        opacity={0.5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill='none'
        stroke={bar}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
        className='transition-[stroke-dashoffset] ease-linear'
        style={{ transitionDuration: `${transitionMs}ms` }}
      />
    </svg>
  )
}
