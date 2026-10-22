import { type ReactNode, useId } from 'react'

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

// Гиря-талисман: корпус и ручка общие для всех сцен, лицо и реквизит сцена кладёт детьми.
// Координаты свои: центр корпуса в 0,0, низ корпуса на y=46 — сцена ставит гирю на пол через translate
export const Kettlebell = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <g className={className}>
    <path
      d='M-26 -26 C-38 -78 38 -78 26 -26'
      fill='none'
      stroke='var(--sb-blue)'
      strokeWidth='14'
      strokeLinecap='round'
    />
    <circle
      r='46'
      fill='var(--sb-blue)'
    />
    {children}
  </g>
)

// Отдых: гиря спит под пледом в ночном колпаке. Дышит, рот похрапывает, кисточка колпака качается, к луне летят «z»
export const RestArt = ({ className }: { className?: string }) => {
  const dots = useId()
  return (
    <svg
      viewBox='0 0 360 200'
      className={cn('w-full', className)}
      aria-hidden
    >
      <defs>
        <Halftone id={dots} />
      </defs>
      {/* Растровая луна: полный круг, срезанный кругом цвета бумаги */}
      <circle
        cx='296'
        cy='62'
        r='42'
        fill={`url(#${dots})`}
        opacity='0.35'
      />
      <circle
        cx='296'
        cy='62'
        r='42'
        fill='none'
        stroke='var(--sb-blue)'
        strokeWidth='1.5'
      />
      <circle
        cx='318'
        cy='46'
        r='38'
        fill='var(--sb-paper)'
      />
      <line
        x1='0'
        x2='360'
        y1='170'
        y2='170'
        stroke='var(--sb-ink)'
        strokeWidth='1.5'
      />
      <path
        d='M104 170 L250 170 L278 188 L132 188 Z'
        fill='var(--sb-ink)'
        opacity='0.85'
      />
      <g transform='translate(170 124)'>
        <Kettlebell className='sb-breathe'>
          {/* Закрытые глаза, румянец и храпящий рот */}
          <path
            d='M-24 -6 Q-17 1 -10 -6 M10 -6 Q17 1 24 -6'
            fill='none'
            stroke='var(--sb-paper)'
            strokeWidth='3'
            strokeLinecap='round'
          />
          <circle
            cx='-30'
            cy='6'
            r='5'
            fill='var(--sb-paper)'
            opacity='0.3'
          />
          <circle
            cx='30'
            cy='6'
            r='5'
            fill='var(--sb-paper)'
            opacity='0.3'
          />
          <ellipse
            cy='11'
            rx='4'
            ry='5'
            fill='var(--sb-ink)'
            className='sb-snore-mouth'
          />
          {/* Ночной колпак на ручке: шапка с отворотом, кончик с кисточкой качается */}
          <path
            d='M-22 -68 C-14 -90 16 -94 28 -72 C14 -66 -8 -64 -22 -68 Z'
            fill='var(--sb-ink)'
          />
          <g
            className='sb-sway'
            style={{ transformOrigin: '5% 15%' }}
          >
            <path
              d='M14 -90 C34 -88 48 -68 50 -44 C40 -54 30 -62 20 -66 Z'
              fill='var(--sb-ink)'
            />
            <circle
              cx='51'
              cy='-40'
              r='7'
              fill='var(--sb-paper)'
              stroke='var(--sb-ink)'
              strokeWidth='2.5'
            />
          </g>
          <path
            d='M-24 -68 C-8 -63 10 -63 30 -72'
            fill='none'
            stroke='var(--sb-paper)'
            strokeWidth='5'
            strokeLinecap='round'
          />
        </Kettlebell>
      </g>
      {/* Плед в клетку до подбородка */}
      <path
        d='M108 170 L112 146 C130 138 150 142 170 146 C190 150 214 140 232 146 L240 170 Z'
        fill='var(--sb-paper)'
        stroke='var(--sb-ink)'
        strokeWidth='2.5'
        strokeLinejoin='round'
      />
      <path
        d='M138 143 L136 170 M168 146 L168 170 M200 147 L202 170 M112 158 L238 158'
        stroke='var(--sb-blue)'
        strokeWidth='5'
        opacity='0.6'
      />
      {/* Поток «z»: три буквы одного такта со сдвигом, рождаются у колпака и тают у луны */}
      <g
        fill='var(--sb-blue)'
        fontFamily='var(--font-display)'
        fontWeight='600'
        fontSize='24'
      >
        {[0, 1.4, 2.8].map(delay => (
          <text
            key={delay}
            x='222'
            y='64'
            className='sb-snore'
            style={{ animationDelay: `-${delay}s` }}
          >
            z
          </text>
        ))}
      </g>
    </svg>
  )
}
