import { useEffect } from 'react';
import { View } from 'react-native';
import {
  Easing,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Canvas, Group, Line, vec } from '@shopify/react-native-skia';

import { useTheme } from '@/shared/theme/ThemeProvider';

// Лучи в два ряда, как деления кольца: длинные и короткие вперемешку
const RAYS = Array.from({ length: 24 }, (_, i) => ({ angle: (i / 24) * 2 * Math.PI, long: i % 2 === 0 }));

// Запас вокруг кольца под разлёт лучей: холст больше кольца, за его краем ничего не рисуется
const MARGIN = 60;

// Волна 1.2 с и пауза 0.4 с; короткие отстают на полволны — расходится не один обруч, а рябь
const useWave = (delayMs: number, still: boolean) => {
  const t = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    t.set(
      withDelay(
        delayMs,
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
  }, [delayMs, still, t]);
  return t;
};

type RayProps = { from: number; long: boolean; color: string; still: boolean; t: SharedValue<number> };

const Ray = ({ from, long, color, still, t }: RayProps) => {
  const length = long ? 16 : 9;
  const travel = long ? 34 : 22;
  const transform = useDerivedValue(() => [{ translateX: still ? 0 : t.value * travel }]);
  // Вспыхивает к середине волны и гаснет к краю: opacity [0, 1, 0]
  const opacity = useDerivedValue(() => {
    if (still) return long ? 0.8 : 0.5;
    return t.value < 0.5 ? t.value * 2 : (1 - t.value) * 2;
  });
  return (
    <Line
      p1={vec(from, 0)}
      p2={vec(from + length, 0)}
      color={color}
      style="stroke"
      strokeWidth={long ? 3 : 2}
      strokeCap="round"
      opacity={opacity}
      transform={transform}
    />
  );
};

type RestRaysProps = {
  /** Сторона кольца, px — лучи стартуют от края делений */
  size: number;
};

// Отдых перед последним подходом окончен: от кольца волнами расходятся лучи — финишная прямая.
// Рисует Skia: вечная волна в react-native-svg перерисовывала весь холст на UI-потоке каждый кадр
export const RestRays = ({ size }: RestRaysProps) => {
  const still = useReducedMotion();
  const { colors } = useTheme();
  // Лучи одного ряда идут в такт — один такт на ряд, а не на каждый луч
  const longWave = useWave(0, still);
  const shortWave = useWave(600, still);
  const canvas = size + MARGIN * 2;
  const center = canvas / 2;
  const from = size / 2 + 4;
  return (
    <View pointerEvents="none" className="absolute" style={{ top: -MARGIN, left: -MARGIN, width: canvas, height: canvas }}>
      <Canvas style={{ width: canvas, height: canvas }}>
        {RAYS.map(({ angle, long }) => (
          <Group key={angle} transform={[{ translateX: center }, { translateY: center }, { rotate: angle }]}>
            <Ray from={from} long={long} color={colors.blue} still={still} t={long ? longWave : shortWave} />
          </Group>
        ))}
      </Canvas>
    </View>
  );
};
