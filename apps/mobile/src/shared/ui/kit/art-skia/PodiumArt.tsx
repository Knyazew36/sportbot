import { Easing, interpolate, useDerivedValue, useReducedMotion } from 'react-native-reanimated';
import { Group, Line, Path, Rect, Text, useFont, vec } from '@shopify/react-native-skia';

import { fontSources } from '@/shared/theme/fonts';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { ArtCanvas } from './ArtCanvas';
import { Kettlebell } from './Kettlebell';
import { phaseDelayMs, useCycle } from './motion';
import { Blush, Breathe, Grin, HalftoneDisc, HappyEyes, Star, type Still } from './parts';

// Порт PodiumArt из Art.tsx (react-native-svg) на Skia: разметка и такты те же, рисует GPU.
// Правки сцены по-прежнему вносим во фронт и переносим сюда

// sb-flash: вспышка камеры — короткий импульс в конце такта
const Flash = ({ path, still, delay = 0 }: Still & { path: string; delay?: number }) => {
  const { colors: c } = useTheme();
  const t = useCycle(2400, { ease: Easing.linear, delayMs: phaseDelayMs(delay, 2.4), paused: still });
  const opacity = useDerivedValue(() => (still ? 1 : interpolate(t.value, [0, 0.7, 0.76, 1], [0, 0, 1, 0])));
  return <Path path={path} color={c.ink} style="stroke" strokeWidth={3} strokeCap="round" opacity={opacity} />;
};

// Номер ступени по центру, как textAnchor="middle"
const Place = ({ x, y, size, text }: { x: number; y: number; size: number; text: string }) => {
  const { colors: c } = useTheme();
  const font = useFont(fontSources.Oswald_700Bold, size);
  if (!font) return null;
  return <Text x={x - font.measureText(text).width / 2} y={y} text={text} font={font} color={c.ink} />;
};

const STEPS = [
  { x: 56, y: 200, width: 80, height: 36 },
  { x: 224, y: 212, width: 80, height: 24 },
  { x: 136, y: 180, width: 88, height: 56 },
];

// «Засчитано»: гиря на верхней ступени пьедестала, по бокам вспыхивают камеры, вокруг мерцают искры
export const PodiumArt = ({ className }: { className?: string }) => {
  const { colors: c } = useTheme();
  const still = useReducedMotion();
  return (
    <ArtCanvas width={360} height={260} className={className}>
      <HalftoneDisc cx={180} cy={104} r={84} />
      <Line p1={vec(0, 236)} p2={vec(360, 236)} color={c.ink} style="stroke" strokeWidth={1.5} />
      <Path path="M56 236 L304 236 L326 250 L78 250 Z" color={c.ink} opacity={0.85} />
      {/* Ступени 2 — 3 — 1 */}
      {STEPS.map((step) => (
        <Group key={step.x}>
          <Rect {...step} color={c.paper} />
          <Rect {...step} color={c.ink} style="stroke" strokeWidth={2.5} />
        </Group>
      ))}
      <Place x={180} y={224} size={36} text="1" />
      <Place x={96} y={228} size={24} text="2" />
      <Place x={264} y={231} size={18} text="3" />
      <Group transform={[{ translateX: 180 }, { translateY: 113 }, { scale: 1.45 }]}>
        <Breathe still={still}>
          <Kettlebell>
            <HappyEyes />
            <Grin />
            <Blush />
          </Kettlebell>
        </Breathe>
      </Group>
      {/* Вспышки камер слева и справа — по очереди */}
      <Flash path="M30 70 L44 80 M22 98 L40 98 M30 126 L44 116" still={still} />
      <Flash path="M330 70 L316 80 M338 98 L320 98 M330 126 L316 116" still={still} delay={1.2} />
      <Star x={64} y={52} size={8} delay={0} still={still} />
      <Star x={296} y={160} size={6} delay={0.7} still={still} />
      <Star x={92} y={150} size={5} delay={1.3} still={still} />
      <Star x={290} y={40} size={5} delay={2} still={still} />
    </ArtCanvas>
  );
};
