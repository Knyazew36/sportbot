import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Line } from 'react-native-svg';

import { useTheme } from '@/shared/theme/ThemeProvider';

const AnimatedLine = Animated.createAnimatedComponent(Line);

// Лучи в два ряда, как деления кольца: длинные и короткие вперемешку
const RAYS = Array.from({ length: 24 }, (_, i) => ({ angle: (i / 24) * 360, long: i % 2 === 0 }));

// Запас вокруг кольца под разлёт лучей: overflow у Svg на Android обрезается, поэтому холст больше кольца
const MARGIN = 60;

type RayProps = { from: number; long: boolean; color: string; still: boolean };

const Ray = ({ from, long, color, still }: RayProps) => {
  const t = useSharedValue(0);
  const length = long ? 16 : 9;
  const travel = long ? 34 : 22;

  useEffect(() => {
    if (still) return;
    // Волна 1.2 с и пауза 0.4 с; короткие отстают на полволны — расходится не один обруч, а рябь
    t.set(
      withDelay(
        long ? 0 : 600,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) }),
            withTiming(1, { duration: 400 }),
            withTiming(0, { duration: 0 }),
          ),
          -1,
        ),
      ),
    );
  }, [long, still, t]);

  const props = useAnimatedProps(() => {
    const shift = still ? 0 : t.value * travel;
    // Вспыхивает к середине волны и гаснет к краю: opacity [0, 1, 0]
    const opacity = still ? (long ? 0.8 : 0.5) : t.value < 0.5 ? t.value * 2 : (1 - t.value) * 2;
    return { x1: from + shift, x2: from + length + shift, opacity };
  });

  return (
    <AnimatedLine
      y1={0}
      y2={0}
      stroke={color}
      strokeWidth={long ? 3 : 2}
      strokeLinecap="round"
      animatedProps={props}
    />
  );
};

type RestRaysProps = {
  /** Сторона кольца, px — лучи стартуют от края делений */
  size: number;
};

// Отдых перед последним подходом окончен: от кольца волнами расходятся лучи — финишная прямая
export const RestRays = ({ size }: RestRaysProps) => {
  const still = useReducedMotion();
  const { colors } = useTheme();
  const canvas = size + MARGIN * 2;
  const center = canvas / 2;
  const from = size / 2 + 4;
  return (
    <View pointerEvents="none" className="absolute" style={{ top: -MARGIN, left: -MARGIN, width: canvas, height: canvas }}>
      <Svg width={canvas} height={canvas}>
        {RAYS.map(({ angle, long }) => (
          <G key={angle} transform={`translate(${center} ${center}) rotate(${angle})`}>
            <Ray from={from} long={long} color={colors.blue} still={still} />
          </G>
        ))}
      </Svg>
    </View>
  );
};
