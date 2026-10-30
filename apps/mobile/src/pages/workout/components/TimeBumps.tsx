import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Poster } from '@/shared/ui/kit/Typography';

const DURATION = 1100;

// Каждое нажатие — своя всплывашка: при быстрых нажатиях они летят друг за другом, а не перезапускают одну
export const useTimeBumps = () => {
  const [bumps, setBumps] = useState<number[]>([]);
  const bumpId = useRef(0);
  return {
    bumps,
    bump: () => {
      bumpId.current += 1;
      const id = bumpId.current;
      setBumps((list) => [...list, id]);
      // Снимаем по таймеру, а не по концу анимации: так не нужен переход с UI-потока обратно в JS
      setTimeout(() => setBumps((list) => list.filter((item) => item !== id)), DURATION);
    },
  };
};

// Всплывает вверх и гаснет — как motion во фронте: opacity [0, 1, 1, 0] на долях [0, .15, .6, 1]
const Bump = ({ label, className }: { label: string; className?: string }) => {
  const still = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) }));
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.15, 0.6, 1], [0, 1, 1, 0]),
    transform: [
      { translateY: still ? 0 : interpolate(progress.value, [0, 1], [8, -56]) },
      { scale: interpolate(progress.value, [0, 0.15], [0.9, 1], 'clamp') },
    ],
  }));

  return (
    <Animated.View className="absolute right-0 bottom-0 left-0 items-center" style={style}>
      <Poster size="lg" tone="primary" numeric numberOfLines={1} className={className}>
        {label}
      </Poster>
    </Animated.View>
  );
};

type TimeBumpsProps = Pick<ReturnType<typeof useTimeBumps>, 'bumps'> & {
  label: string;
  /** Цвет экрана, если он не синий: разминка */
  className?: string;
};

// Над цифрами и вне потока: всплывашка не двигает таймер. По ширине цифр — чтобы стоять по центру над ними
export const TimeBumps = ({ bumps, label, className }: TimeBumpsProps) => (
  <View pointerEvents="none" style={{ bottom: '100%' }} className="absolute right-0 left-0">
    {bumps.map((id) => (
      <Bump key={id} label={label} className={className} />
    ))}
  </View>
);
