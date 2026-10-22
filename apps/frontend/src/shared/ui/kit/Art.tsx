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

// Дуга ручки гири: нужна и сценам, где сквозь ручку что-то продето
const KETTLEBELL_HANDLE = 'M-26 -26 C-38 -78 38 -78 26 -26'

// Гиря-талисман: корпус, ручка и фактура общие для всех сцен, лицо и реквизит сцена кладёт детьми.
// Координаты свои: центр корпуса в 0,0, низ корпуса на y=46 — сцена ставит гирю на пол через translate
export const Kettlebell = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <g className={className}>
    <path
      d={KETTLEBELL_HANDLE}
      fill='none'
      stroke='var(--sb-blue)'
      strokeWidth='14'
      strokeLinecap='round'
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
    {/* Выдавленный вес зависит от палитры: синяя — 32 кг, розовая — 16 кг. Видимую надпись выбирает CSS */}
    <g
      textAnchor='middle'
      fill='var(--sb-ink)'
      opacity='0.3'
      fontFamily='var(--font-display)'
      fontWeight='600'
      fontSize='11'
    >
      <text
        y='26'
        className='sb-kb-classic'
      >
        32 кг
      </text>
      <text
        y='26'
        className='sb-kb-rose'
      >
        16 кг
      </text>
    </g>
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

// День тренировки: штанга на стойках, слева блины, справа вместо блина висит гиря и качается маятником
export const TrainingArt = ({ className }: { className?: string }) => {
  const dots = useId()
  const half = useId()
  return (
    <svg
      viewBox='0 0 360 260'
      className={cn('w-full', className)}
      aria-hidden
    >
      <defs>
        <Halftone id={dots} />
        <clipPath id={half}>
          <rect
            x='0'
            y='-100'
            width='60'
            height='100'
          />
        </clipPath>
      </defs>
      {/* Растровое солнце между стойками */}
      <circle
        cx='116'
        cy='156'
        r='62'
        fill={`url(#${dots})`}
        opacity='0.3'
      />
      <circle
        cx='116'
        cy='156'
        r='62'
        fill='none'
        stroke='var(--sb-blue)'
        strokeWidth='1.5'
      />
      <line
        x1='0'
        x2='360'
        y1='236'
        y2='236'
        stroke='var(--sb-ink)'
        strokeWidth='1.5'
      />
      {/* Тени: стойки стоят, тень гири бегает за качанием */}
      <path
        d='M58 236 L174 236 L194 248 L78 248 Z'
        fill='var(--sb-ink)'
        opacity='0.85'
      />
      <path
        d='M226 236 L290 236 L302 245 L238 245 Z'
        fill='var(--sb-ink)'
        opacity='0.85'
        className='sb-pendulum-shadow'
      />
      {/* Стойки с крюками */}
      <path
        d='M74 64 L74 236 M158 64 L158 236 M58 233 L90 233 M142 233 L174 233'
        stroke='var(--sb-ink)'
        strokeWidth='8'
      />
      <path
        d='M66 70 L66 86 L82 86 L82 78 M150 70 L150 86 L166 86 L166 78'
        fill='none'
        stroke='var(--sb-ink)'
        strokeWidth='4'
        strokeLinejoin='round'
      />
      {/* Гиря висит ручкой на грифе: качание вокруг точки подвеса */}
      <g
        className='sb-pendulum'
        style={{ transformOrigin: '256px 80px' }}
      >
        <g transform='translate(256 160) scale(1.45)'>
          <Kettlebell>
            {/* Подмигивает и улыбается */}
            <path
              d='M-24 -8 Q-17 -14 -10 -8'
              fill='none'
              stroke='var(--sb-paper)'
              strokeWidth='3'
              strokeLinecap='round'
            />
            <circle
              cx='16'
              cy='-8'
              r='7'
              fill='var(--sb-paper)'
            />
            <circle
              cx='17'
              cy='-9'
              r='3.5'
              fill='var(--sb-ink)'
            />
            <path
              d='M-12 4 Q0 20 12 4 Z'
              fill='var(--sb-ink)'
            />
            <circle
              cx='-30'
              cy='4'
              r='5'
              fill='var(--sb-paper)'
              opacity='0.3'
            />
            <circle
              cx='30'
              cy='4'
              r='5'
              fill='var(--sb-paper)'
              opacity='0.3'
            />
          </Kettlebell>
        </g>
      </g>
      {/* Гриф продет сквозь ручку: перед левой стороной, за правой. Блины слева уходят за край */}
      <rect
        x='0'
        y='76'
        width='336'
        height='7'
        fill='var(--sb-ink)'
      />
      {/* Правая половина ручки поверх грифа — качается вместе с гирей */}
      <g
        className='sb-pendulum'
        style={{ transformOrigin: '256px 80px' }}
      >
        <path
          d={KETTLEBELL_HANDLE}
          transform='translate(256 160) scale(1.45)'
          clipPath={`url(#${half})`}
          fill='none'
          stroke='var(--sb-blue)'
          strokeWidth='14'
          strokeLinecap='round'
        />
      </g>
      <rect
        x='2'
        y='20'
        width='22'
        height='120'
        rx='3'
        fill='var(--sb-blue)'
        opacity='0.45'
      />
      <rect
        x='20'
        y='20'
        width='5'
        height='120'
        fill='var(--sb-ink)'
      />
      <rect
        x='27'
        y='38'
        width='16'
        height='84'
        rx='3'
        fill='var(--sb-blue)'
      />
      <rect
        x='45'
        y='69'
        width='8'
        height='21'
        fill='var(--sb-ink)'
      />
      {/* Замок справа не даёт гире соскочить */}
      <rect
        x='318'
        y='69'
        width='8'
        height='21'
        fill='var(--sb-ink)'
      />
    </svg>
  )
}

// Лицо гири по частям: сцены собирают из них настроение
const HappyEyes = () => (
  <path
    d='M-24 -6 Q-17 -14 -10 -6 M10 -6 Q17 -14 24 -6'
    fill='none'
    stroke='var(--sb-paper)'
    strokeWidth='3'
    strokeLinecap='round'
  />
)

const Grin = () => (
  <path
    d='M-12 4 Q0 20 12 4 Z'
    fill='var(--sb-ink)'
  />
)

const Blush = () => (
  <>
    <circle
      cx='-30'
      cy='4'
      r='5'
      fill='var(--sb-paper)'
      opacity='0.3'
    />
    <circle
      cx='30'
      cy='4'
      r='5'
      fill='var(--sb-paper)'
      opacity='0.3'
    />
  </>
)

// Конфетти: падает и кружится, у каждого кусочка свой сдвиг и темп
const CONFETTI = [
  { x: 70, y: 10, ink: false, delay: 0, duration: 3.4 },
  { x: 108, y: 30, ink: true, delay: 1.1, duration: 2.9 },
  { x: 150, y: 4, ink: false, delay: 2.3, duration: 3.6 },
  { x: 196, y: 22, ink: true, delay: 0.6, duration: 3.1 },
  { x: 236, y: 8, ink: false, delay: 1.8, duration: 3.3 },
  { x: 276, y: 28, ink: true, delay: 2.7, duration: 2.8 },
  { x: 306, y: 12, ink: false, delay: 0.3, duration: 3.5 },
]

// Итог тренировки: гиря на бегу рвёт финишную ленту, обрывки трепещут, сверху сыплется конфетти
export const FinishArt = ({ className }: { className?: string }) => {
  const dots = useId()
  return (
    <svg
      viewBox='0 0 360 260'
      className={cn('w-full', className)}
      aria-hidden
    >
      <defs>
        <Halftone id={dots} />
      </defs>
      <circle
        cx='184'
        cy='128'
        r='80'
        fill={`url(#${dots})`}
        opacity='0.3'
      />
      <circle
        cx='184'
        cy='128'
        r='80'
        fill='none'
        stroke='var(--sb-blue)'
        strokeWidth='1.5'
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
        d='M28 236 L52 236 L62 242 L38 242 Z M308 236 L332 236 L342 242 L318 242 Z M142 236 L230 236 L246 246 L158 246 Z'
        fill='var(--sb-ink)'
        opacity='0.85'
      />
      {/* Финишные стойки */}
      <path
        d='M40 64 L40 236 M320 64 L320 236'
        stroke='var(--sb-ink)'
        strokeWidth='6'
      />
      {/* Обрывки ленты трепещут от стоек */}
      <path
        d='M40 122 C58 126 74 142 86 162 L77 167 C66 148 54 136 40 132 Z'
        fill='var(--sb-paper)'
        stroke='var(--sb-ink)'
        strokeWidth='2'
        strokeLinejoin='round'
        className='sb-flutter'
        style={{ transformOrigin: '0% 10%' }}
      />
      <path
        d='M320 122 C300 118 288 104 282 84 L273 89 C280 112 298 128 320 132 Z'
        fill='var(--sb-paper)'
        stroke='var(--sb-ink)'
        strokeWidth='2'
        strokeLinejoin='round'
        className='sb-flutter'
        style={{ transformOrigin: '100% 90%', animationDelay: '-0.25s' }}
      />
      {/* Линии скорости позади */}
      <path
        d='M58 168 L100 168 M66 186 L106 186 M58 204 L96 204'
        stroke='var(--sb-blue)'
        strokeWidth='3'
        strokeLinecap='round'
      />
      {/* Гиря подаётся вперёд и подпрыгивает на бегу */}
      <g className='sb-bob'>
        <g transform='translate(186 150) rotate(12) scale(1.5)'>
          <Kettlebell>
            <HappyEyes />
            <Grin />
            <Blush />
          </Kettlebell>
        </g>
      </g>
      {CONFETTI.map(({ x, y, ink, delay, duration }) => (
        <rect
          key={x}
          x={x}
          y={y}
          width='8'
          height='4'
          fill={ink ? 'var(--sb-ink)' : 'var(--sb-blue)'}
          className='sb-confetti'
          style={{ animationDelay: `-${delay}s`, animationDuration: `${duration}s` }}
        />
      ))}
    </svg>
  )
}

// «Засчитано»: гиря на верхней ступени пьедестала, по бокам вспыхивают камеры, вокруг мерцают искры
export const PodiumArt = ({ className }: { className?: string }) => {
  const dots = useId()
  return (
    <svg
      viewBox='0 0 360 260'
      className={cn('w-full', className)}
      aria-hidden
    >
      <defs>
        <Halftone id={dots} />
      </defs>
      <circle
        cx='180'
        cy='104'
        r='84'
        fill={`url(#${dots})`}
        opacity='0.3'
      />
      <circle
        cx='180'
        cy='104'
        r='84'
        fill='none'
        stroke='var(--sb-blue)'
        strokeWidth='1.5'
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
        d='M56 236 L304 236 L326 250 L78 250 Z'
        fill='var(--sb-ink)'
        opacity='0.85'
      />
      {/* Ступени 2 — 1 — 3 */}
      <g
        fill='var(--sb-paper)'
        stroke='var(--sb-ink)'
        strokeWidth='2.5'
      >
        <rect
          x='56'
          y='200'
          width='80'
          height='36'
        />
        <rect
          x='224'
          y='212'
          width='80'
          height='24'
        />
        <rect
          x='136'
          y='180'
          width='88'
          height='56'
        />
      </g>
      <g
        fill='var(--sb-ink)'
        fontFamily='var(--font-display)'
        fontWeight='600'
        textAnchor='middle'
      >
        <text
          x='180'
          y='224'
          fontSize='36'
        >
          1
        </text>
        <text
          x='96'
          y='228'
          fontSize='24'
        >
          2
        </text>
        <text
          x='264'
          y='231'
          fontSize='18'
        >
          3
        </text>
      </g>
      <g transform='translate(180 113) scale(1.45)'>
        <Kettlebell className='sb-breathe'>
          <HappyEyes />
          <Grin />
          <Blush />
        </Kettlebell>
      </g>
      {/* Вспышки камер слева и справа — по очереди */}
      <path
        d='M30 70 L44 80 M22 98 L40 98 M30 126 L44 116'
        stroke='var(--sb-ink)'
        strokeWidth='3'
        strokeLinecap='round'
        className='sb-flash'
      />
      <path
        d='M330 70 L316 80 M338 98 L320 98 M330 126 L316 116'
        stroke='var(--sb-ink)'
        strokeWidth='3'
        strokeLinecap='round'
        className='sb-flash'
        style={{ animationDelay: '-1.2s' }}
      />
      <Star
        x={64}
        y={52}
        size={8}
        delay={0}
      />
      <Star
        x={296}
        y={160}
        size={6}
        delay={0.7}
      />
      <Star
        x={92}
        y={150}
        size={5}
        delay={1.3}
      />
      <Star
        x={290}
        y={40}
        size={5}
        delay={2}
      />
    </svg>
  )
}
