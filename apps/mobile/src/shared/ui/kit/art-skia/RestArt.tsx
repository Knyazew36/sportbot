import { useMemo, type ReactNode } from 'react';
import { interpolate, useDerivedValue, useReducedMotion } from 'react-native-reanimated';
import { Circle, Group, Line, Oval, Paint, Path, RoundedRect, Text, useFont, vec } from '@shopify/react-native-skia';

import { fontSources } from '@/shared/theme/fonts';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { ArtCanvas } from './ArtCanvas';
import { Kettlebell } from './Kettlebell';
import { around, deg, EASE_OUT, IDENTITY, phaseDelayMs, useCycle } from './motion';
import { halftoneDots, starPath } from './paths';

// Порт RestArt из Art.tsx (react-native-svg) на Skia: разметка и такты те же, рисует GPU.
// Правки сцены по-прежнему вносим во фронт и переносим сюда

type Still = { still: boolean };

const BLANKET = 'M92 236 L96 206 C124 198 152 206 182 204 C212 202 240 196 270 204 L276 236 Z';
const MOON_CLIP = 'M24 58 A34 34 0 1 0 92 58 A34 34 0 1 0 24 58 Z';

// sb-twinkle: звезда мерцает вразнобой, сдвиг задаёт разметка
const Star = ({ x, y, size = 6, delay, still }: Still & { x: number; y: number; size?: number; delay: number }) => {
  const { colors: c } = useTheme();
  const t = useCycle(1600, { reverse: true, delayMs: phaseDelayMs(delay, 3.2), paused: still });
  const opacity = useDerivedValue(() => (still ? 1 : 0.25 + 0.75 * t.value));
  const transform = useDerivedValue(() => (still ? IDENTITY : around(x, y, [{ scale: 0.6 + 0.4 * t.value }])));
  return <Path path={starPath(x, y, size)} color={c.blue} opacity={opacity} transform={transform} />;
};

// sb-breathe: корпус дышит от пола — низ стоит (origin — низ корпуса гири, y=46)
const Breathe = ({ children, still }: Still & { children?: ReactNode }) => {
  const t = useCycle(2100, { reverse: true, paused: still });
  const transform = useDerivedValue(() =>
    still ? IDENTITY : around(0, 46, [{ scaleX: 1 + 0.02 * t.value }, { scaleY: 1 + 0.05 * t.value }]),
  );
  return <Group transform={transform}>{children}</Group>;
};

// sb-snore-mouth: рот похрапывает в такт дыханию
const SnoreMouth = ({ still }: Still) => {
  const { colors: c } = useTheme();
  const t = useCycle(2100, { reverse: true, paused: still });
  const transform = useDerivedValue(() =>
    still ? IDENTITY : around(0, 8, [{ scaleX: 1 + 0.3 * t.value }, { scaleY: 1 + 0.6 * t.value }]),
  );
  return <Oval x={-4} y={3} width={8} height={10} color={c.ink} transform={transform} />;
};

// sb-sway: качание -6°…6° вокруг точки крепления
const Sway = ({
  children,
  still,
  origin,
  duration,
}: Still & { children?: ReactNode; origin: [number, number]; duration: number }) => {
  const t = useCycle(duration, { reverse: true, paused: still });
  const [ox, oy] = origin;
  const transform = useDerivedValue(() => (still ? IDENTITY : around(ox, oy, [{ rotate: deg(-6 + 12 * t.value) }])));
  return <Group transform={transform}>{children}</Group>;
};

// sb-snore: «z» рождается у кисточки колпака и тает в небе; без движения остаётся одна — сон читается и в статике
const SnoreZ = ({ delay, still, staticShown }: Still & { delay: number; staticShown: boolean }) => {
  const { colors: c } = useTheme();
  const font = useFont(fontSources.Oswald_700Bold, 28);
  const t = useCycle(4200, { ease: EASE_OUT, delayMs: phaseDelayMs(delay, 4.2), paused: still });
  const opacity = useDerivedValue(() => {
    if (still) return staticShown ? 1 : 0;
    return interpolate(t.value, [0, 0.25, 1], [0, 1, 0]);
  });
  const transform = useDerivedValue(() => {
    if (still) return staticShown ? [{ translateX: 14 }, { translateY: -14 }] : IDENTITY;
    return [{ translateX: 40 * t.value }, { translateY: -44 * t.value }, ...around(272, 72, [{ scale: 0.5 + t.value }])];
  });
  if (!font) return null;
  return <Text x={266} y={84} text="z" font={font} color={c.blue} opacity={opacity} transform={transform} />;
};

// Отдых: гиря спит, привалившись к подушке, под клетчатым пледом в ночном колпаке.
// Дышит, рот похрапывает, кисточка колпака качается, звёзды мерцают, к небу летят «z»
export const RestArt = ({ className }: { className?: string }) => {
  const { colors: c } = useTheme();
  const still = useReducedMotion();
  const moonDots = useMemo(() => halftoneDots(58, 58, 34), []);
  return (
    <ArtCanvas width={360} height={260} className={className}>
      {/* Растровая луна: полный круг, срезанный кругом цвета бумаги */}
      <Group clip={MOON_CLIP}>
        <Path path={moonDots} color={c.blue} opacity={0.35} />
      </Group>
      <Circle cx={58} cy={58} r={34} color={c.blue} style="stroke" strokeWidth={1.5} />
      <Circle cx={78} cy={44} r={30} color={c.paper} />
      <Star x={120} y={28} delay={0} still={still} />
      <Star x={330} y={30} size={5} delay={0.8} still={still} />
      <Star x={28} y={130} size={4} delay={1.6} still={still} />
      <Star x={334} y={136} size={7} delay={2.2} still={still} />
      <Line p1={vec(0, 236)} p2={vec(360, 236)} color={c.ink} style="stroke" strokeWidth={1.5} />
      <Path path="M96 236 L272 236 L300 252 L124 252 Z" color={c.ink} opacity={0.85} />
      {/* Подушка, на которую завалилась гиря */}
      <Group transform={around(105, 152, [{ rotate: deg(-14) }])}>
        <RoundedRect x={48} y={120} width={112} height={64} r={26} color={c.paper} />
        <RoundedRect x={48} y={120} width={112} height={64} r={26} color={c.ink} style="stroke" strokeWidth={2.5} />
        <Path
          path="M60 138 C80 146 104 146 124 138"
          color={c.blue}
          style="stroke"
          strokeWidth={2}
          strokeCap="round"
          opacity={0.6}
        />
      </Group>
      <Group transform={[{ translateX: 184 }, { translateY: 158 }, { rotate: deg(-8) }, { scale: 1.55 }]}>
        <Breathe still={still}>
          <Kettlebell>
            {/* Закрытые глаза с ресницами, румянец и храпящий рот */}
            <Path
              path="M-24 -10 Q-17 -3 -10 -10 M10 -10 Q17 -3 24 -10"
              color={c.paper}
              style="stroke"
              strokeWidth={3}
              strokeCap="round"
            />
            <Path
              path="M-20 -5 L-21 -1 M-15 -5 L-15 -1 M15 -5 L15 -1 M20 -5 L21 -1"
              color={c.paper}
              style="stroke"
              strokeWidth={1.5}
              strokeCap="round"
            />
            <Circle cx={-30} cy={2} r={5} color={c.paper} opacity={0.3} />
            <Circle cx={30} cy={2} r={5} color={c.paper} opacity={0.3} />
            <SnoreMouth still={still} />
            {/* Ночной колпак на ручке: шапка с отворотом, кончик с кисточкой качается */}
            <Path path="M-22 -68 C-14 -90 16 -94 28 -72 C14 -66 -8 -64 -22 -68 Z" color={c.ink} />
            <Sway still={still} origin={[16, -81]} duration={2100}>
              <Path path="M14 -90 C34 -88 48 -68 50 -44 C40 -54 30 -62 20 -66 Z" color={c.ink} />
              <Circle cx={51} cy={-40} r={7} color={c.paper} />
              <Circle cx={51} cy={-40} r={7} color={c.ink} style="stroke" strokeWidth={2.5} />
            </Sway>
            <Path
              path="M-24 -68 C-8 -63 10 -63 30 -72"
              color={c.paper}
              style="stroke"
              strokeWidth={5}
              strokeCap="round"
            />
          </Kettlebell>
        </Breathe>
      </Group>
      {/* Плед в клетку: клетка обрезана по краю пледа, по бокам бахрома, правый угол отогнут */}
      <Path path={BLANKET} color={c.paper} />
      {/* layer — прозрачность на всю клетку разом, как у SVG-группы: пересечения полос не темнеют */}
      <Group clip={BLANKET} layer={<Paint opacity={0.6} />}>
        <Path
          path="M122 194 L120 240 M154 194 L154 240 M186 194 L186 240 M218 194 L220 240 M250 194 L252 240"
          color={c.blue}
          style="stroke"
          strokeWidth={6}
        />
        <Path path="M86 224 L282 224" color={c.blue} style="stroke" strokeWidth={5} />
        <Path
          path="M138 194 L138 240 M202 194 L202 240 M234 194 L234 240 M86 214 L282 214 M86 232 L282 232"
          color={c.blue}
          style="stroke"
          strokeWidth={1.5}
        />
      </Group>
      <Path path={BLANKET} color={c.ink} style="stroke" strokeWidth={2.5} strokeJoin="round" />
      <Path path="M248 200 L270 204 L265 222 Z" color={c.blue} />
      <Path path="M248 200 L270 204 L265 222 Z" color={c.ink} style="stroke" strokeWidth={2} strokeJoin="round" />
      <Path
        path="M95 212 L87 214 M94 220 L86 222 M93 228 L85 230 M273 212 L281 214 M274 220 L282 222 M275 228 L283 230"
        color={c.ink}
        style="stroke"
        strokeWidth={1.5}
        strokeCap="round"
      />
      {/* Поток «z»: три буквы одного такта со сдвигом, рождаются у кисточки и тают в небе */}
      {[0, 1.4, 2.8].map((delay, i) => (
        <SnoreZ key={delay} delay={delay} still={still} staticShown={i === 0} />
      ))}
    </ArtCanvas>
  );
};
