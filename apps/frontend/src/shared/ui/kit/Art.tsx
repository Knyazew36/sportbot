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

// Гиря-талисман: корпус, ручка и фактура общие для всех сцен, лицо и реквизит сцена кладёт детьми.
// Координаты свои: центр корпуса в 0,0, донышко стоит на y=48 — сцена ставит гирю на пол через translate
export const Kettlebell = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <g className={className}>
    <path
      d='M-26 -26 C-38 -78 38 -78 26 -26'
      fill='none'
      stroke='var(--sb-blue)'
      strokeWidth='14'
      strokeLinecap='round'
    />
    {/* Плоское донышко */}
    <rect
      x='-30'
      y='36'
      width='60'
      height='12'
      rx='3'
      fill='var(--sb-blue)'
    />
    <circle
      r='46'
      fill='var(--sb-blue)'
    />
    {/* Блик литого чугуна */}
    <path
      d='M-36 -12 A38 38 0 0 1 -16 -36'
      fill='none'
      stroke='var(--sb-paper)'
      strokeWidth='5'
      strokeLinecap='round'
      opacity='0.45'
    />
    <circle
      cx='-10'
      cy='-39'
      r='2.5'
      fill='var(--sb-paper)'
      opacity='0.45'
    />
    {/* Выдавленный вес */}
    <text
      y='26'
      textAnchor='middle'
      fill='var(--sb-ink)'
      opacity='0.3'
      fontFamily='var(--font-display)'
      fontWeight='600'
      fontSize='11'
    >
      16 кг
    </text>
    {children}
  </g>
)

// Четырёхлучевая звезда для ночного неба
const Star = ({ x, y, size = 6, delay }: { x: number; y: number; size?: number; delay: number }) => {
  const t = size / 4
  return (
    <path
      d={`M${x} ${y - size} L${x + t} ${y - t} L${x + size} ${y} L${x + t} ${y + t} L${x} ${y + size} L${x - t} ${y + t} L${x - size} ${y} L${x - t} ${y - t} Z`}
      fill='var(--sb-blue)'
      className='sb-twinkle'
      style={{ animationDelay: `-${delay}s` }}
    />
  )
}

// Отдых: гиря спит, привалившись к подушке, под клетчатым пледом в ночном колпаке.
// Дышит, рот похрапывает, кисточка колпака качается, звёзды мерцают, к небу летят «z»
export const RestArt = ({ className }: { className?: string }) => {
  const dots = useId()
  const plaid = useId()
  const blanket = 'M92 236 L96 206 C124 198 152 206 182 204 C212 202 240 196 270 204 L276 236 Z'
  return (
    <svg
      viewBox='0 0 360 260'
      className={cn('w-full', className)}
      aria-hidden
    >
      <defs>
        <Halftone id={dots} />
        <clipPath id={plaid}>
          <path d={blanket} />
        </clipPath>
      </defs>
      {/* Растровая луна: полный круг, срезанный кругом цвета бумаги */}
      <circle
        cx='58'
        cy='58'
        r='34'
        fill={`url(#${dots})`}
        opacity='0.35'
      />
      <circle
        cx='58'
        cy='58'
        r='34'
        fill='none'
        stroke='var(--sb-blue)'
        strokeWidth='1.5'
      />
      <circle
        cx='78'
        cy='44'
        r='30'
        fill='var(--sb-paper)'
      />
      <Star
        x={120}
        y={28}
        delay={0}
      />
      <Star
        x={330}
        y={30}
        size={5}
        delay={0.8}
      />
      <Star
        x={28}
        y={130}
        size={4}
        delay={1.6}
      />
      <Star
        x={334}
        y={136}
        size={7}
        delay={2.2}
      />
      <line
        x1='0'
        x2='360'
        y1='236'
        y2='236'
        stroke='var(--sb-ink)'
        strokeWidth='1.5'
      />
      <path
        d='M96 236 L272 236 L300 252 L124 252 Z'
        fill='var(--sb-ink)'
        opacity='0.85'
      />
      {/* Подушка, на которую завалилась гиря */}
      <g transform='rotate(-14 105 152)'>
        <rect
          x='48'
          y='120'
          width='112'
          height='64'
          rx='26'
          fill='var(--sb-paper)'
          stroke='var(--sb-ink)'
          strokeWidth='2.5'
        />
        <path
          d='M60 138 C80 146 104 146 124 138'
          fill='none'
          stroke='var(--sb-blue)'
          strokeWidth='2'
          strokeLinecap='round'
          opacity='0.6'
        />
      </g>
      <g transform='translate(184 158) rotate(-8) scale(1.55)'>
        <Kettlebell className='sb-breathe'>
          {/* Закрытые глаза с ресницами, румянец и храпящий рот */}
          <path
            d='M-24 -10 Q-17 -3 -10 -10 M10 -10 Q17 -3 24 -10'
            fill='none'
            stroke='var(--sb-paper)'
            strokeWidth='3'
            strokeLinecap='round'
          />
          <path
            d='M-20 -5 L-21 -1 M-15 -5 L-15 -1 M15 -5 L15 -1 M20 -5 L21 -1'
            stroke='var(--sb-paper)'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
          <circle
            cx='-30'
            cy='2'
            r='5'
            fill='var(--sb-paper)'
            opacity='0.3'
          />
          <circle
            cx='30'
            cy='2'
            r='5'
            fill='var(--sb-paper)'
            opacity='0.3'
          />
          <ellipse
            cy='8'
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
      {/* Плед в клетку: клетка обрезана по краю пледа, по бокам бахрома, правый угол отогнут */}
      <path
        d={blanket}
        fill='var(--sb-paper)'
      />
      <g
        clipPath={`url(#${plaid})`}
        stroke='var(--sb-blue)'
        opacity='0.6'
      >
        <path
          d='M122 194 L120 240 M154 194 L154 240 M186 194 L186 240 M218 194 L220 240 M250 194 L252 240'
          strokeWidth='6'
        />
        <path
          d='M86 224 L282 224'
          strokeWidth='5'
        />
        <path
          d='M138 194 L138 240 M202 194 L202 240 M234 194 L234 240 M86 214 L282 214 M86 232 L282 232'
          strokeWidth='1.5'
        />
      </g>
      <path
        d={blanket}
        fill='none'
        stroke='var(--sb-ink)'
        strokeWidth='2.5'
        strokeLinejoin='round'
      />
      <path
        d='M248 200 L270 204 L265 222 Z'
        fill='var(--sb-blue)'
        stroke='var(--sb-ink)'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <path
        d='M95 212 L87 214 M94 220 L86 222 M93 228 L85 230 M273 212 L281 214 M274 220 L282 222 M275 228 L283 230'
        stroke='var(--sb-ink)'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      {/* Поток «z»: три буквы одного такта со сдвигом, рождаются у кисточки и тают в небе */}
      <g
        fill='var(--sb-blue)'
        fontFamily='var(--font-display)'
        fontWeight='600'
        fontSize='28'
      >
        {[0, 1.4, 2.8].map(delay => (
          <text
            key={delay}
            x='266'
            y='84'
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
