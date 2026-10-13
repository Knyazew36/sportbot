import { useId } from 'react'

import { cn } from '@/shared/lib/utils'

// Плоские иллюстрации в духе плаката середины века: синий с прозрачностью для форм, чёрный для теней и деталей

const Halftone = ({ id, size = 6 }: { id: string; size?: number }) => (
  <pattern
    id={id}
    width={size}
    height={size}
    patternUnits='userSpaceOnUse'
  >
    <circle
      cx={size / 2}
      cy={size / 2}
      r={size / 4.2}
      fill='var(--sb-blue)'
    />
  </pattern>
)

export const BarbellArt = ({ className }: { className?: string }) => {
  const dots = useId()
  return (
    <svg
      viewBox='0 0 360 210'
      className={cn('w-full', className)}
      aria-hidden
    >
      <defs>
        <Halftone id={dots} />
      </defs>
      {/* Солнце-растр за снарядом */}
      <circle
        cx='238'
        cy='96'
        r='86'
        fill={`url(#${dots})`}
        opacity='0.35'
      />
      <circle
        cx='238'
        cy='96'
        r='86'
        fill='none'
        stroke='var(--sb-blue)'
        strokeWidth='1.5'
      />
      {/* Линии скорости */}
      {[78, 92, 120].map((y, i) => (
        <line
          key={y}
          x1={6 + i * 6}
          x2={44}
          y1={y}
          y2={y}
          stroke='var(--sb-blue)'
          strokeWidth='2'
          strokeLinecap='round'
        />
      ))}
      <line
        x1='0'
        x2='360'
        y1='182'
        y2='182'
        stroke='var(--sb-ink)'
        strokeWidth='1.5'
      />
      {/* Жёсткая тень на полу */}
      <path
        d='M70 182 L118 182 L150 200 L102 200 Z M262 182 L310 182 L342 200 L294 200 Z'
        fill='var(--sb-ink)'
        opacity='0.85'
      />
      <rect
        x='24'
        y='96'
        width='312'
        height='7'
        fill='var(--sb-ink)'
      />
      {/* Левый край: большой блин, малый блин, замок */}
      <rect
        x='58'
        y='40'
        width='26'
        height='120'
        rx='3'
        fill='var(--sb-blue)'
        opacity='0.45'
      />
      <rect
        x='78'
        y='40'
        width='6'
        height='120'
        fill='var(--sb-ink)'
      />
      <rect
        x='86'
        y='58'
        width='18'
        height='84'
        rx='3'
        fill='var(--sb-blue)'
      />
      <rect
        x='106'
        y='88'
        width='9'
        height='23'
        fill='var(--sb-ink)'
      />
      {/* Правый край */}
      <rect
        x='276'
        y='40'
        width='26'
        height='120'
        rx='3'
        fill='var(--sb-blue)'
        opacity='0.45'
      />
      <rect
        x='296'
        y='40'
        width='6'
        height='120'
        fill='var(--sb-ink)'
      />
      <rect
        x='256'
        y='58'
        width='18'
        height='84'
        rx='3'
        fill='var(--sb-blue)'
      />
      <rect
        x='245'
        y='88'
        width='9'
        height='23'
        fill='var(--sb-ink)'
      />
      {/* Насечки грифа */}
      {Array.from({ length: 9 }, (_, i) => (
        <line
          key={i}
          x1={146 + i * 8}
          x2={146 + i * 8}
          y1='96'
          y2='103'
          stroke='var(--sb-paper)'
          strokeWidth='1'
          opacity='0.7'
        />
      ))}
    </svg>
  )
}

export const StretchArt = ({ className }: { className?: string }) => {
  const dots = useId()
  return (
    <svg
      viewBox='0 0 260 280'
      className={cn('w-full', className)}
      aria-hidden
    >
      <defs>
        <Halftone
          id={dots}
          size={7}
        />
      </defs>
      <circle
        cx='112'
        cy='128'
        r='104'
        fill={`url(#${dots})`}
        opacity='0.28'
      />
      {/* Стена */}
      <rect
        x='196'
        y='0'
        width='22'
        height='254'
        fill='var(--sb-blue)'
        opacity='0.22'
      />
      <rect
        x='196'
        y='0'
        width='3'
        height='254'
        fill='var(--sb-blue)'
      />
      <line
        x1='0'
        x2='260'
        y1='254'
        y2='254'
        stroke='var(--sb-ink)'
        strokeWidth='1.5'
      />
      <path
        d='M78 254 L150 254 L180 274 L108 274 Z'
        fill='var(--sb-ink)'
        opacity='0.85'
      />
      {/* Дальняя нога */}
      <path
        d='M112 160 L90 252'
        stroke='var(--sb-blue)'
        strokeOpacity='0.45'
        strokeWidth='20'
        strokeLinecap='round'
      />
      {/* Корпус, развёрнутый от стены */}
      <path
        d='M118 74 L112 164'
        stroke='var(--sb-blue)'
        strokeWidth='34'
        strokeLinecap='round'
      />
      {/* Ближняя нога */}
      <path
        d='M114 164 L134 252'
        stroke='var(--sb-blue)'
        strokeWidth='20'
        strokeLinecap='round'
      />
      {/* Рука на стене: плечо горизонтально, предплечье вверх */}
      <path
        d='M128 82 L194 82 L194 34'
        fill='none'
        stroke='var(--sb-ink)'
        strokeWidth='11'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <circle
        cx='120'
        cy='38'
        r='19'
        fill='var(--sb-ink)'
      />
      {/* Дуга натяжения */}
      <path
        d='M150 120 A46 46 0 0 0 168 58'
        fill='none'
        stroke='var(--sb-blue)'
        strokeWidth='2'
        strokeDasharray='3 5'
        strokeLinecap='round'
      />
      <path
        d='M160 60 L168 56 L170 65'
        fill='none'
        stroke='var(--sb-blue)'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// Медаль финиша: лента и диск, цифра серии кладётся поверх снаружи
export const MedalArt = ({ className }: { className?: string }) => {
  const dots = useId()
  return (
    <svg
      viewBox='0 0 220 260'
      className={cn('w-full', className)}
      aria-hidden
    >
      <defs>
        <Halftone id={dots} />
      </defs>
      <path
        d='M62 0 L104 0 L128 104 L92 116 Z'
        fill='var(--sb-blue)'
      />
      <path
        d='M158 0 L116 0 L92 104 L128 116 Z'
        fill='var(--sb-ink)'
      />
      <circle
        cx='110'
        cy='166'
        r='84'
        fill='var(--sb-paper)'
        stroke='var(--sb-blue)'
        strokeWidth='2'
      />
      <circle
        cx='110'
        cy='166'
        r='70'
        fill={`url(#${dots})`}
        opacity='0.3'
      />
      <circle
        cx='110'
        cy='166'
        r='70'
        fill='none'
        stroke='var(--sb-blue)'
        strokeWidth='1'
        strokeDasharray='2 4'
      />
    </svg>
  )
}
