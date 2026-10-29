import type { ReactNode } from 'react';
import { interpolate, useDerivedValue, useReducedMotion } from 'react-native-reanimated';
import { Circle, Group, Line, Path, Rect, RoundedRect, rect, vec } from '@shopify/react-native-skia';

import { useTheme } from '@/shared/theme/ThemeProvider';

import { ArtCanvas } from './ArtCanvas';
import { Kettlebell } from './Kettlebell';
import { around, deg, IDENTITY, useCycle } from './motion';
import { Blush, Grin, HalftoneDisc, type Still } from './parts';
import { KETTLEBELL_HANDLE } from './paths';

// Порт TrainingArt из Art.tsx (react-native-svg) на Skia: разметка и такты те же, рисует GPU.
// Правки сцены по-прежнему вносим во фронт и переносим сюда

// Гиря висит на грифе: та же посадка у тела и у правой половины ручки поверх грифа
const HANG = [{ translateX: 256 }, { translateY: 160 }, { scale: 1.45 }];
// Правая половина ручки в координатах гири — её рисуем поверх грифа
const HANDLE_RIGHT = rect(0, -100, 60, 100);

// sb-pendulum: гиря качается на грифе вокруг точки подвеса (256, 80)
const Pendulum = ({ children, still }: Still & { children?: ReactNode }) => {
  const t = useCycle(2200, { reverse: true, paused: still });
  const transform = useDerivedValue(() => (still ? IDENTITY : around(256, 80, [{ rotate: deg(-10 + 20 * t.value) }])));
  return <Group transform={transform}>{children}</Group>;
};

// sb-pendulum-shadow: тень бегает за качанием гири (origin — центр тени, 264, 240.5)
const PendulumShadow = ({ still }: Still) => {
  const { colors: c } = useTheme();
  const t = useCycle(2200, { reverse: true, paused: still });
  const transform = useDerivedValue(() =>
    still
      ? IDENTITY
      : [
          { translateX: 24 - 48 * t.value },
          ...around(264, 240.5, [{ scaleX: interpolate(t.value, [0, 0.5, 1], [0.85, 1.1, 0.85]) }]),
        ],
  );
  return <Path path="M226 236 L290 236 L302 245 L238 245 Z" color={c.ink} opacity={0.85} transform={transform} />;
};

// Тренировка: гиря висит ручкой на грифе между стойками и качается маятником, подмигивая
export const TrainingArt = ({ className }: { className?: string }) => {
  const { colors: c } = useTheme();
  const still = useReducedMotion();
  return (
    <ArtCanvas width={360} height={260} className={className}>
      {/* Растровое солнце между стойками */}
      <HalftoneDisc cx={116} cy={156} r={62} />
      <Line p1={vec(0, 236)} p2={vec(360, 236)} color={c.ink} style="stroke" strokeWidth={1.5} />
      {/* Тени: стойки стоят, тень гири бегает за качанием */}
      <Path path="M58 236 L174 236 L194 248 L78 248 Z" color={c.ink} opacity={0.85} />
      <PendulumShadow still={still} />
      {/* Стойки с крюками */}
      <Path
        path="M74 64 L74 236 M158 64 L158 236 M58 233 L90 233 M142 233 L174 233"
        color={c.ink}
        style="stroke"
        strokeWidth={8}
      />
      <Path
        path="M66 70 L66 86 L82 86 L82 78 M150 70 L150 86 L166 86 L166 78"
        color={c.ink}
        style="stroke"
        strokeWidth={4}
        strokeJoin="round"
      />
      {/* Гиря висит ручкой на грифе: качание вокруг точки подвеса */}
      <Pendulum still={still}>
        <Group transform={HANG}>
          <Kettlebell>
            {/* Подмигивает и улыбается */}
            <Path
              path="M-24 -8 Q-17 -14 -10 -8"
              color={c.paper}
              style="stroke"
              strokeWidth={3}
              strokeCap="round"
            />
            <Circle cx={16} cy={-8} r={7} color={c.paper} />
            <Circle cx={17} cy={-9} r={3.5} color={c.ink} />
            <Grin />
            <Blush />
          </Kettlebell>
        </Group>
      </Pendulum>
      {/* Гриф продет сквозь ручку: перед левой стороной, за правой. Блины слева уходят за край */}
      <Rect x={0} y={76} width={336} height={7} color={c.ink} />
      {/* Правая половина ручки поверх грифа — качается вместе с гирей */}
      <Pendulum still={still}>
        <Group transform={HANG} clip={HANDLE_RIGHT}>
          <Path path={KETTLEBELL_HANDLE} color={c.blue} style="stroke" strokeWidth={14} strokeCap="round" />
        </Group>
      </Pendulum>
      <RoundedRect x={2} y={20} width={22} height={120} r={3} color={c.blue} opacity={0.45} />
      <Rect x={20} y={20} width={5} height={120} color={c.ink} />
      <RoundedRect x={27} y={38} width={16} height={84} r={3} color={c.blue} />
      <Rect x={45} y={69} width={8} height={21} color={c.ink} />
      {/* Замок справа не даёт гире соскочить */}
      <Rect x={318} y={69} width={8} height={21} color={c.ink} />
    </ArtCanvas>
  );
};
