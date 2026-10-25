import { useId, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Pattern, Rect, Text as SvgText } from 'react-native-svg';

import { cn } from '@/shared/lib/utils';
import { fonts } from '@/shared/theme/fonts';
import { useTheme } from '@/shared/theme/ThemeProvider';

// СГЕНЕРИРОВАНО из apps/frontend/src/shared/ui/kit/Art.tsx скриптом конвертации (svg → react-native-svg).
// Правки сцен вносим во фронт и перегоняем. Отличия: цвета из темы вместо CSS-переменных,
// CSS-анимации (дыхание, маятник, мерцание) сняты — в RN сцены статичны

// Раскладка снаружи (отступы, ширина) — classNames на обёртке; сама сцена тянется по ширине с пропорцией viewBox
type ArtProps = { className?: string };

// useId в React 19 даёт ««r0»» — в url(#…) react-native-svg такие символы не переварит
const useSvgId = () => useId().replace(/[^a-zA-Z0-9]/g, '');


// Плоские иллюстрации в духе плаката середины века: синий с прозрачностью для форм, чёрный для теней и деталей

const Halftone = ({ id, size = 6 }: { id: string; size?: number }) => {
  const { colors: c } = useTheme()
  return (
    <Pattern
      id={id}
      width={size}
      height={size}
      patternUnits='userSpaceOnUse'
    >
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={size / 4.2}
        fill={c.blue}
      />
    </Pattern>
  )
}

export const StretchArt = ({ className }: ArtProps) => {
  const { colors: c } = useTheme()
  const dots = useSvgId()
  return (
    <View className={cn('w-full', className)}>
    <Svg
      viewBox='0 0 260 280'
      style={{ width: '100%', aspectRatio: 260 / 280 }}
    >
      <Defs>
        <Halftone
          id={dots}
          size={7}
        />
      </Defs>
      <Circle
        cx='112'
        cy='128'
        r='104'
        fill={`url(#${dots})`}
        opacity='0.28'
      />
      {/* Стена */}
      <Rect
        x='196'
        y='0'
        width='22'
        height='254'
        fill={c.blue}
        opacity='0.22'
      />
      <Rect
        x='196'
        y='0'
        width='3'
        height='254'
        fill={c.blue}
      />
      <Line
        x1='0'
        x2='260'
        y1='254'
        y2='254'
        stroke={c.ink}
        strokeWidth='1.5'
      />
      <Path
        d='M78 254 L150 254 L180 274 L108 274 Z'
        fill={c.ink}
        opacity='0.85'
      />
      {/* Дальняя нога */}
      <Path
        d='M112 160 L90 252'
        stroke={c.blue}
        strokeOpacity='0.45'
        strokeWidth='20'
        strokeLinecap='round'
      />
      {/* Корпус, развёрнутый от стены */}
      <Path
        d='M118 74 L112 164'
        stroke={c.blue}
        strokeWidth='34'
        strokeLinecap='round'
      />
      {/* Ближняя нога */}
      <Path
        d='M114 164 L134 252'
        stroke={c.blue}
        strokeWidth='20'
        strokeLinecap='round'
      />
      {/* Рука на стене: плечо горизонтально, предплечье вверх */}
      <Path
        d='M128 82 L194 82 L194 34'
        fill='none'
        stroke={c.ink}
        strokeWidth='11'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <Circle
        cx='120'
        cy='38'
        r='19'
        fill={c.ink}
      />
      {/* Дуга натяжения */}
      <Path
        d='M150 120 A46 46 0 0 0 168 58'
        fill='none'
        stroke={c.blue}
        strokeWidth='2'
        strokeDasharray='3 5'
        strokeLinecap='round'
      />
      <Path
        d='M160 60 L168 56 L170 65'
        fill='none'
        stroke={c.blue}
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Svg>
    </View>
  )
}

// Медаль финиша: лента и диск, цифра серии кладётся поверх снаружи
export const MedalArt = ({ className }: ArtProps) => {
  const { colors: c } = useTheme()
  const dots = useSvgId()
  return (
    <View className={cn('w-full', className)}>
    <Svg
      viewBox='0 0 220 260'
      style={{ width: '100%', aspectRatio: 220 / 260 }}
    >
      <Defs>
        <Halftone id={dots} />
      </Defs>
      <Path
        d='M62 0 L104 0 L128 104 L92 116 Z'
        fill={c.blue}
      />
      <Path
        d='M158 0 L116 0 L92 104 L128 116 Z'
        fill={c.ink}
      />
      <Circle
        cx='110'
        cy='166'
        r='84'
        fill={c.paper}
        stroke={c.blue}
        strokeWidth='2'
      />
      <Circle
        cx='110'
        cy='166'
        r='70'
        fill={`url(#${dots})`}
        opacity='0.3'
      />
      <Circle
        cx='110'
        cy='166'
        r='70'
        fill='none'
        stroke={c.blue}
        strokeWidth='1'
        strokeDasharray='2 4'
      />
    </Svg>
    </View>
  )
}

// Дуга ручки гири: нужна и сценам, где сквозь ручку что-то продето
const KETTLEBELL_HANDLE = 'M-26 -26 C-38 -78 38 -78 26 -26'

// Гиря-талисман: корпус, ручка и фактура общие для всех сцен, лицо и реквизит сцена кладёт детьми.
// Координаты свои: центр корпуса в 0,0, низ корпуса на y=46 — сцена ставит гирю на пол через translate
export const Kettlebell = ({ children }: { children?: ReactNode }) => {
  const { colors: c, palette } = useTheme()
  return (
    <G>
      <Path
        d={KETTLEBELL_HANDLE}
        fill='none'
        stroke={c.blue}
        strokeWidth='14'
        strokeLinecap='round'
      />
      <Circle
        r='46'
        fill={c.blue}
      />
      {/* Блик литого чугуна */}
      <Path
        d='M-36 -12 A38 38 0 0 1 -16 -36'
        fill='none'
        stroke={c.paper}
        strokeWidth='5'
        strokeLinecap='round'
        opacity='0.45'
      />
      <Circle
        cx='-10'
        cy='-39'
        r='2.5'
        fill={c.paper}
        opacity='0.45'
      />
      {/* Выдавленный вес зависит от палитры: синяя — 32 кг, розовая — 16 кг */}
      <G
        textAnchor='middle'
        fill={c.ink}
        opacity='0.3'
        fontFamily={fonts.display}
        fontWeight='600'
        fontSize='11'
      >
        <SvgText y='26'>{palette === 'rose' ? '16 кг' : '32 кг'}</SvgText>
      </G>
      {children}
    </G>
  )
}

// Четырёхлучевая звезда для ночного неба
const Star = ({ x, y, size = 6, delay }: { x: number; y: number; size?: number; delay: number }) => {
  const { colors: c } = useTheme()
  const t = size / 4
  return (
    <Path
      d={`M${x} ${y - size} L${x + t} ${y - t} L${x + size} ${y} L${x + t} ${y + t} L${x} ${y + size} L${x - t} ${y + t} L${x - size} ${y} L${x - t} ${y - t} Z`}
      fill={c.blue}
    />
  )
}

// Отдых: гиря спит, привалившись к подушке, под клетчатым пледом в ночном колпаке.
// Дышит, рот похрапывает, кисточка колпака качается, звёзды мерцают, к небу летят «z»
export const RestArt = ({ className }: ArtProps) => {
  const { colors: c } = useTheme()
  const dots = useSvgId()
  const plaid = useSvgId()
  const blanket = 'M92 236 L96 206 C124 198 152 206 182 204 C212 202 240 196 270 204 L276 236 Z'
  return (
    <View className={cn('w-full', className)}>
    <Svg
      viewBox='0 0 360 260'
      style={{ width: '100%', aspectRatio: 360 / 260 }}
    >
      <Defs>
        <Halftone id={dots} />
        <ClipPath id={plaid}>
          <Path d={blanket} />
        </ClipPath>
      </Defs>
      {/* Растровая луна: полный круг, срезанный кругом цвета бумаги */}
      <Circle
        cx='58'
        cy='58'
        r='34'
        fill={`url(#${dots})`}
        opacity='0.35'
      />
      <Circle
        cx='58'
        cy='58'
        r='34'
        fill='none'
        stroke={c.blue}
        strokeWidth='1.5'
      />
      <Circle
        cx='78'
        cy='44'
        r='30'
        fill={c.paper}
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
      <Line
        x1='0'
        x2='360'
        y1='236'
        y2='236'
        stroke={c.ink}
        strokeWidth='1.5'
      />
      <Path
        d='M96 236 L272 236 L300 252 L124 252 Z'
        fill={c.ink}
        opacity='0.85'
      />
      {/* Подушка, на которую завалилась гиря */}
      <G transform='rotate(-14 105 152)'>
        <Rect
          x='48'
          y='120'
          width='112'
          height='64'
          rx='26'
          fill={c.paper}
          stroke={c.ink}
          strokeWidth='2.5'
        />
        <Path
          d='M60 138 C80 146 104 146 124 138'
          fill='none'
          stroke={c.blue}
          strokeWidth='2'
          strokeLinecap='round'
          opacity='0.6'
        />
      </G>
      <G transform='translate(184 158) rotate(-8) scale(1.55)'>
        <Kettlebell>
          {/* Закрытые глаза с ресницами, румянец и храпящий рот */}
          <Path
            d='M-24 -10 Q-17 -3 -10 -10 M10 -10 Q17 -3 24 -10'
            fill='none'
            stroke={c.paper}
            strokeWidth='3'
            strokeLinecap='round'
          />
          <Path
            d='M-20 -5 L-21 -1 M-15 -5 L-15 -1 M15 -5 L15 -1 M20 -5 L21 -1'
            stroke={c.paper}
            strokeWidth='1.5'
            strokeLinecap='round'
          />
          <Circle
            cx='-30'
            cy='2'
            r='5'
            fill={c.paper}
            opacity='0.3'
          />
          <Circle
            cx='30'
            cy='2'
            r='5'
            fill={c.paper}
            opacity='0.3'
          />
          <Ellipse
            cy='8'
            rx='4'
            ry='5'
            fill={c.ink}
          />
          {/* Ночной колпак на ручке: шапка с отворотом, кончик с кисточкой качается */}
          <Path
            d='M-22 -68 C-14 -90 16 -94 28 -72 C14 -66 -8 -64 -22 -68 Z'
            fill={c.ink}
          />
          <G
          >
            <Path
              d='M14 -90 C34 -88 48 -68 50 -44 C40 -54 30 -62 20 -66 Z'
              fill={c.ink}
            />
            <Circle
              cx='51'
              cy='-40'
              r='7'
              fill={c.paper}
              stroke={c.ink}
              strokeWidth='2.5'
            />
          </G>
          <Path
            d='M-24 -68 C-8 -63 10 -63 30 -72'
            fill='none'
            stroke={c.paper}
            strokeWidth='5'
            strokeLinecap='round'
          />
        </Kettlebell>
      </G>
      {/* Плед в клетку: клетка обрезана по краю пледа, по бокам бахрома, правый угол отогнут */}
      <Path
        d={blanket}
        fill={c.paper}
      />
      <G
        clipPath={`url(#${plaid})`}
        stroke={c.blue}
        opacity='0.6'
      >
        <Path
          d='M122 194 L120 240 M154 194 L154 240 M186 194 L186 240 M218 194 L220 240 M250 194 L252 240'
          strokeWidth='6'
        />
        <Path
          d='M86 224 L282 224'
          strokeWidth='5'
        />
        <Path
          d='M138 194 L138 240 M202 194 L202 240 M234 194 L234 240 M86 214 L282 214 M86 232 L282 232'
          strokeWidth='1.5'
        />
      </G>
      <Path
        d={blanket}
        fill='none'
        stroke={c.ink}
        strokeWidth='2.5'
        strokeLinejoin='round'
      />
      <Path
        d='M248 200 L270 204 L265 222 Z'
        fill={c.blue}
        stroke={c.ink}
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <Path
        d='M95 212 L87 214 M94 220 L86 222 M93 228 L85 230 M273 212 L281 214 M274 220 L282 222 M275 228 L283 230'
        stroke={c.ink}
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      {/* Поток «z»: три буквы одного такта со сдвигом, рождаются у кисточки и тают в небе */}
      <G
        fill={c.blue}
        fontFamily={fonts.display}
        fontWeight='600'
        fontSize='28'
      >
        {[0, 1.4, 2.8].map(delay => (
          <SvgText
            key={delay}
            x='266'
            y='84'
          >
            z
          </SvgText>
        ))}
      </G>
    </Svg>
    </View>
  )
}

// День тренировки: штанга на стойках, слева блины, справа вместо блина висит гиря и качается маятником
export const TrainingArt = ({ className }: ArtProps) => {
  const { colors: c } = useTheme()
  const dots = useSvgId()
  const half = useSvgId()
  return (
    <View className={cn('w-full', className)}>
    <Svg
      viewBox='0 0 360 260'
      style={{ width: '100%', aspectRatio: 360 / 260 }}
    >
      <Defs>
        <Halftone id={dots} />
        <ClipPath id={half}>
          <Rect
            x='0'
            y='-100'
            width='60'
            height='100'
          />
        </ClipPath>
      </Defs>
      {/* Растровое солнце между стойками */}
      <Circle
        cx='116'
        cy='156'
        r='62'
        fill={`url(#${dots})`}
        opacity='0.3'
      />
      <Circle
        cx='116'
        cy='156'
        r='62'
        fill='none'
        stroke={c.blue}
        strokeWidth='1.5'
      />
      <Line
        x1='0'
        x2='360'
        y1='236'
        y2='236'
        stroke={c.ink}
        strokeWidth='1.5'
      />
      {/* Тени: стойки стоят, тень гири бегает за качанием */}
      <Path
        d='M58 236 L174 236 L194 248 L78 248 Z'
        fill={c.ink}
        opacity='0.85'
      />
      <Path
        d='M226 236 L290 236 L302 245 L238 245 Z'
        fill={c.ink}
        opacity='0.85'
      />
      {/* Стойки с крюками */}
      <Path
        d='M74 64 L74 236 M158 64 L158 236 M58 233 L90 233 M142 233 L174 233'
        stroke={c.ink}
        strokeWidth='8'
      />
      <Path
        d='M66 70 L66 86 L82 86 L82 78 M150 70 L150 86 L166 86 L166 78'
        fill='none'
        stroke={c.ink}
        strokeWidth='4'
        strokeLinejoin='round'
      />
      {/* Гиря висит ручкой на грифе: качание вокруг точки подвеса */}
      <G
      >
        <G transform='translate(256 160) scale(1.45)'>
          <Kettlebell>
            {/* Подмигивает и улыбается */}
            <Path
              d='M-24 -8 Q-17 -14 -10 -8'
              fill='none'
              stroke={c.paper}
              strokeWidth='3'
              strokeLinecap='round'
            />
            <Circle
              cx='16'
              cy='-8'
              r='7'
              fill={c.paper}
            />
            <Circle
              cx='17'
              cy='-9'
              r='3.5'
              fill={c.ink}
            />
            <Path
              d='M-12 4 Q0 20 12 4 Z'
              fill={c.ink}
            />
            <Circle
              cx='-30'
              cy='4'
              r='5'
              fill={c.paper}
              opacity='0.3'
            />
            <Circle
              cx='30'
              cy='4'
              r='5'
              fill={c.paper}
              opacity='0.3'
            />
          </Kettlebell>
        </G>
      </G>
      {/* Гриф продет сквозь ручку: перед левой стороной, за правой. Блины слева уходят за край */}
      <Rect
        x='0'
        y='76'
        width='336'
        height='7'
        fill={c.ink}
      />
      {/* Правая половина ручки поверх грифа — качается вместе с гирей */}
      <G
      >
        <Path
          d={KETTLEBELL_HANDLE}
          transform='translate(256 160) scale(1.45)'
          clipPath={`url(#${half})`}
          fill='none'
          stroke={c.blue}
          strokeWidth='14'
          strokeLinecap='round'
        />
      </G>
      <Rect
        x='2'
        y='20'
        width='22'
        height='120'
        rx='3'
        fill={c.blue}
        opacity='0.45'
      />
      <Rect
        x='20'
        y='20'
        width='5'
        height='120'
        fill={c.ink}
      />
      <Rect
        x='27'
        y='38'
        width='16'
        height='84'
        rx='3'
        fill={c.blue}
      />
      <Rect
        x='45'
        y='69'
        width='8'
        height='21'
        fill={c.ink}
      />
      {/* Замок справа не даёт гире соскочить */}
      <Rect
        x='318'
        y='69'
        width='8'
        height='21'
        fill={c.ink}
      />
    </Svg>
    </View>
  )
}

// Лицо гири по частям: сцены собирают из них настроение
const HappyEyes = () => {
  const { colors: c } = useTheme()
  return (
    <Path
      d='M-24 -6 Q-17 -14 -10 -6 M10 -6 Q17 -14 24 -6'
      fill='none'
      stroke={c.paper}
      strokeWidth='3'
      strokeLinecap='round'
    />
  )
}

const Grin = () => {
  const { colors: c } = useTheme()
  return (
    <Path
      d='M-12 4 Q0 20 12 4 Z'
      fill={c.ink}
    />
  )
}

const Blush = () => {
  const { colors: c } = useTheme()
  return (
    <>
      <Circle
        cx='-30'
        cy='4'
        r='5'
        fill={c.paper}
        opacity='0.3'
      />
      <Circle
        cx='30'
        cy='4'
        r='5'
        fill={c.paper}
        opacity='0.3'
      />
    </>
  )
}

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
export const FinishArt = ({ className }: ArtProps) => {
  const { colors: c } = useTheme()
  const dots = useSvgId()
  return (
    <View className={cn('w-full', className)}>
    <Svg
      viewBox='0 0 360 260'
      style={{ width: '100%', aspectRatio: 360 / 260 }}
    >
      <Defs>
        <Halftone id={dots} />
      </Defs>
      <Circle
        cx='184'
        cy='128'
        r='80'
        fill={`url(#${dots})`}
        opacity='0.3'
      />
      <Circle
        cx='184'
        cy='128'
        r='80'
        fill='none'
        stroke={c.blue}
        strokeWidth='1.5'
      />
      <Line
        x1='0'
        x2='360'
        y1='236'
        y2='236'
        stroke={c.ink}
        strokeWidth='1.5'
      />
      <Path
        d='M28 236 L52 236 L62 242 L38 242 Z M308 236 L332 236 L342 242 L318 242 Z M142 236 L230 236 L246 246 L158 246 Z'
        fill={c.ink}
        opacity='0.85'
      />
      {/* Финишные стойки */}
      <Path
        d='M40 64 L40 236 M320 64 L320 236'
        stroke={c.ink}
        strokeWidth='6'
      />
      {/* Обрывки ленты трепещут от стоек */}
      <Path
        d='M40 122 C58 126 74 142 86 162 L77 167 C66 148 54 136 40 132 Z'
        fill={c.paper}
        stroke={c.ink}
        strokeWidth='2'
        strokeLinejoin='round'
      />
      <Path
        d='M320 122 C300 118 288 104 282 84 L273 89 C280 112 298 128 320 132 Z'
        fill={c.paper}
        stroke={c.ink}
        strokeWidth='2'
        strokeLinejoin='round'
      />
      {/* Линии скорости позади */}
      <Path
        d='M58 168 L100 168 M66 186 L106 186 M58 204 L96 204'
        stroke={c.blue}
        strokeWidth='3'
        strokeLinecap='round'
      />
      {/* Гиря подаётся вперёд и подпрыгивает на бегу */}
      <G>
        <G transform='translate(186 150) rotate(12) scale(1.5)'>
          <Kettlebell>
            <HappyEyes />
            <Grin />
            <Blush />
          </Kettlebell>
        </G>
      </G>
      {CONFETTI.map(({ x, y, ink }) => (
        <Rect
          key={x}
          x={x}
          y={y}
          width='8'
          height='4'
          fill={ink ? c.ink : c.blue}
        />
      ))}
    </Svg>
    </View>
  )
}

// «Засчитано»: гиря на верхней ступени пьедестала, по бокам вспыхивают камеры, вокруг мерцают искры
export const PodiumArt = ({ className }: ArtProps) => {
  const { colors: c } = useTheme()
  const dots = useSvgId()
  return (
    <View className={cn('w-full', className)}>
    <Svg
      viewBox='0 0 360 260'
      style={{ width: '100%', aspectRatio: 360 / 260 }}
    >
      <Defs>
        <Halftone id={dots} />
      </Defs>
      <Circle
        cx='180'
        cy='104'
        r='84'
        fill={`url(#${dots})`}
        opacity='0.3'
      />
      <Circle
        cx='180'
        cy='104'
        r='84'
        fill='none'
        stroke={c.blue}
        strokeWidth='1.5'
      />
      <Line
        x1='0'
        x2='360'
        y1='236'
        y2='236'
        stroke={c.ink}
        strokeWidth='1.5'
      />
      <Path
        d='M56 236 L304 236 L326 250 L78 250 Z'
        fill={c.ink}
        opacity='0.85'
      />
      {/* Ступени 2 — 1 — 3 */}
      <G
        fill={c.paper}
        stroke={c.ink}
        strokeWidth='2.5'
      >
        <Rect
          x='56'
          y='200'
          width='80'
          height='36'
        />
        <Rect
          x='224'
          y='212'
          width='80'
          height='24'
        />
        <Rect
          x='136'
          y='180'
          width='88'
          height='56'
        />
      </G>
      <G
        fill={c.ink}
        fontFamily={fonts.display}
        fontWeight='600'
        textAnchor='middle'
      >
        <SvgText
          x='180'
          y='224'
          fontSize='36'
        >
          1
        </SvgText>
        <SvgText
          x='96'
          y='228'
          fontSize='24'
        >
          2
        </SvgText>
        <SvgText
          x='264'
          y='231'
          fontSize='18'
        >
          3
        </SvgText>
      </G>
      <G transform='translate(180 113) scale(1.45)'>
        <Kettlebell>
          <HappyEyes />
          <Grin />
          <Blush />
        </Kettlebell>
      </G>
      {/* Вспышки камер слева и справа — по очереди */}
      <Path
        d='M30 70 L44 80 M22 98 L40 98 M30 126 L44 116'
        stroke={c.ink}
        strokeWidth='3'
        strokeLinecap='round'
      />
      <Path
        d='M330 70 L316 80 M338 98 L320 98 M330 126 L316 116'
        stroke={c.ink}
        strokeWidth='3'
        strokeLinecap='round'
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
    </Svg>
    </View>
  )
}
