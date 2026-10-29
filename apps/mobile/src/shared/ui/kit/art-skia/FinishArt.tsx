import type { ReactNode } from 'react';
import { Easing, interpolate, useDerivedValue, useReducedMotion } from 'react-native-reanimated';
import { Group, Line, Path, Rect, vec } from '@shopify/react-native-skia';

import { useTheme } from '@/shared/theme/ThemeProvider';

import { ArtCanvas } from './ArtCanvas';
import { Kettlebell } from './Kettlebell';
import { around, deg, IDENTITY, phaseDelayMs, useCycle } from './motion';
import { Blush, Grin, HalftoneDisc, HappyEyes, Sway, type Still } from './parts';

// Порт FinishArt из Art.tsx (react-native-svg) на Skia: разметка и такты те же, рисует GPU.
// Правки сцены по-прежнему вносим во фронт и переносим сюда

// Конфетти: падает и кружится, у каждого кусочка свой сдвиг и темп
const CONFETTI = [
  { x: 70, y: 10, ink: false, delay: 0, duration: 3.4 },
  { x: 108, y: 30, ink: true, delay: 1.1, duration: 2.9 },
  { x: 150, y: 4, ink: false, delay: 2.3, duration: 3.6 },
  { x: 196, y: 22, ink: true, delay: 0.6, duration: 3.1 },
  { x: 236, y: 8, ink: false, delay: 1.8, duration: 3.3 },
  { x: 276, y: 28, ink: true, delay: 2.7, duration: 2.8 },
  { x: 306, y: 12, ink: false, delay: 0.3, duration: 3.5 },
];

const RIBBON_LEFT = 'M40 122 C58 126 74 142 86 162 L77 167 C66 148 54 136 40 132 Z';
const RIBBON_RIGHT = 'M320 122 C300 118 288 104 282 84 L273 89 C280 112 298 128 320 132 Z';

// sb-bob: гиря подпрыгивает на бегу
const Bob = ({ children, still }: Still & { children?: ReactNode }) => {
  const t = useCycle(1100, { reverse: true, paused: still });
  const transform = useDerivedValue(() => (still ? IDENTITY : [{ translateY: -8 * t.value }]));
  return <Group transform={transform}>{children}</Group>;
};

// sb-confetti: кусочек падает и кружится, темп и сдвиг свои у каждого
const ConfettiPiece = ({
  x,
  y,
  ink,
  delay,
  duration,
  still,
}: Still & { x: number; y: number; ink: boolean; delay: number; duration: number }) => {
  const { colors: c } = useTheme();
  const t = useCycle(duration * 1000, { ease: Easing.linear, delayMs: phaseDelayMs(delay, duration), paused: still });
  const opacity = useDerivedValue(() => (still ? 1 : interpolate(t.value, [0, 0.1, 0.85, 1], [0, 1, 1, 0])));
  const transform = useDerivedValue(() =>
    still
      ? IDENTITY
      : [
          { translateX: 14 * t.value },
          { translateY: -20 + 230 * t.value },
          ...around(x + 4, y + 2, [{ rotate: deg(540 * t.value) }]),
        ],
  );
  return (
    <Rect x={x} y={y} width={8} height={4} color={ink ? c.ink : c.blue} opacity={opacity} transform={transform} />
  );
};

const Ribbon = ({ path }: { path: string }) => {
  const { colors: c } = useTheme();
  return (
    <>
      <Path path={path} color={c.paper} />
      <Path path={path} color={c.ink} style="stroke" strokeWidth={2} strokeJoin="round" />
    </>
  );
};

// Итог тренировки: гиря на бегу рвёт финишную ленту, обрывки трепещут, сверху сыплется конфетти
export const FinishArt = ({ className }: { className?: string }) => {
  const { colors: c } = useTheme();
  const still = useReducedMotion();
  return (
    <ArtCanvas width={360} height={260} className={className}>
      <HalftoneDisc cx={184} cy={128} r={80} />
      <Line p1={vec(0, 236)} p2={vec(360, 236)} color={c.ink} style="stroke" strokeWidth={1.5} />
      <Path
        path="M28 236 L52 236 L62 242 L38 242 Z M308 236 L332 236 L342 242 L318 242 Z M142 236 L230 236 L246 246 L158 246 Z"
        color={c.ink}
        opacity={0.85}
      />
      {/* Финишные стойки */}
      <Path path="M40 64 L40 236 M320 64 L320 236" color={c.ink} style="stroke" strokeWidth={6} />
      {/* Обрывки ленты трепещут от стоек */}
      <Sway still={still} origin={[40, 126]} duration={500}>
        <Ribbon path={RIBBON_LEFT} />
      </Sway>
      <Sway still={still} origin={[320, 127]} duration={500} delay={0.25}>
        <Ribbon path={RIBBON_RIGHT} />
      </Sway>
      {/* Линии скорости позади */}
      <Path
        path="M58 168 L100 168 M66 186 L106 186 M58 204 L96 204"
        color={c.blue}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
      />
      {/* Гиря подаётся вперёд и подпрыгивает на бегу */}
      <Bob still={still}>
        <Group transform={[{ translateX: 186 }, { translateY: 150 }, { rotate: deg(12) }, { scale: 1.5 }]}>
          <Kettlebell>
            <HappyEyes />
            <Grin />
            <Blush />
          </Kettlebell>
        </Group>
      </Bob>
      {CONFETTI.map(({ x, y, ink, delay, duration }) => (
        <ConfettiPiece key={x} x={x} y={y} ink={ink} delay={delay} duration={duration} still={still} />
      ))}
    </ArtCanvas>
  );
};
