import { useMemo, type ReactNode } from 'react';
import { useDerivedValue } from 'react-native-reanimated';
import { Circle, Group, Path } from '@shopify/react-native-skia';

import { useTheme } from '@/shared/theme/ThemeProvider';

import { around, deg, IDENTITY, phaseDelayMs, useCycle } from './motion';
import { circlePath, halftoneDots, starPath } from './paths';

// Общие детали сцен на Skia: такты и лицо гири, из которых сцены собирают настроение

export type Still = { still: boolean };

// sb-twinkle: звезда мерцает вразнобой, сдвиг задаёт разметка
export const Star = ({ x, y, size = 6, delay, still }: Still & { x: number; y: number; size?: number; delay: number }) => {
  const { colors: c } = useTheme();
  const t = useCycle(1600, { reverse: true, delayMs: phaseDelayMs(delay, 3.2), paused: still });
  const opacity = useDerivedValue(() => (still ? 1 : 0.25 + 0.75 * t.value));
  const transform = useDerivedValue(() => (still ? IDENTITY : around(x, y, [{ scale: 0.6 + 0.4 * t.value }])));
  return <Path path={starPath(x, y, size)} color={c.blue} opacity={opacity} transform={transform} />;
};

// sb-breathe: корпус дышит от пола — низ стоит (origin — низ корпуса гири, y=46)
export const Breathe = ({ children, still }: Still & { children?: ReactNode }) => {
  const t = useCycle(2100, { reverse: true, paused: still });
  const transform = useDerivedValue(() =>
    still ? IDENTITY : around(0, 46, [{ scaleX: 1 + 0.02 * t.value }, { scaleY: 1 + 0.05 * t.value }]),
  );
  return <Group transform={transform}>{children}</Group>;
};

// sb-sway / sb-flutter: качание -6°…6° вокруг точки крепления
export const Sway = ({
  children,
  still,
  origin,
  duration,
  delay = 0,
}: Still & { children?: ReactNode; origin: [number, number]; duration: number; delay?: number }) => {
  const t = useCycle(duration, { reverse: true, delayMs: phaseDelayMs(delay, (duration * 2) / 1000), paused: still });
  const [ox, oy] = origin;
  const transform = useDerivedValue(() => (still ? IDENTITY : around(ox, oy, [{ rotate: deg(-6 + 12 * t.value) }])));
  return <Group transform={transform}>{children}</Group>;
};

// Растровое «солнце» за героем сцены: точки по кругу и тонкий контур
export const HalftoneDisc = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => {
  const { colors: c } = useTheme();
  const dots = useMemo(() => halftoneDots(cx, cy, r), [cx, cy, r]);
  return (
    <>
      <Group clip={circlePath(cx, cy, r)}>
        <Path path={dots} color={c.blue} opacity={0.3} />
      </Group>
      <Circle cx={cx} cy={cy} r={r} color={c.blue} style="stroke" strokeWidth={1.5} />
    </>
  );
};

// Лицо гири по частям
export const HappyEyes = () => {
  const { colors: c } = useTheme();
  return (
    <Path
      path="M-24 -6 Q-17 -14 -10 -6 M10 -6 Q17 -14 24 -6"
      color={c.paper}
      style="stroke"
      strokeWidth={3}
      strokeCap="round"
    />
  );
};

export const Grin = () => {
  const { colors: c } = useTheme();
  return <Path path="M-12 4 Q0 20 12 4 Z" color={c.ink} />;
};

export const Blush = () => {
  const { colors: c } = useTheme();
  return (
    <>
      <Circle cx={-30} cy={4} r={5} color={c.paper} opacity={0.3} />
      <Circle cx={30} cy={4} r={5} color={c.paper} opacity={0.3} />
    </>
  );
};
