import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { cn } from '@/shared/lib/utils';

// Точка «идёт» — порт shared/ui/kit/LiveDot.tsx: тот же знак, что у записи на табло.
// Цвет — классом bg-*, по умолчанию синий. Волна — animate-ping фронта
export const LiveDot = ({ className }: { className?: string }) => {
  const still = useReducedMotion();
  const ping = useSharedValue(0);

  useEffect(() => {
    if (still) return;
    ping.set(withRepeat(withTiming(1, { duration: 1000, easing: Easing.bezier(0, 0, 0.2, 1) }), -1, false));
  }, [ping, still]);

  const wave = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - ping.value),
    transform: [{ scale: 1 + ping.value }],
  }));

  const color = cn('bg-primary', className);

  return (
    <View importantForAccessibility="no-hide-descendants" className="size-1.5 shrink-0">
      {!still && <Animated.View className={cn('absolute inset-0 rounded-full', color)} style={wave} />}
      <View className={cn('size-full rounded-full', color)} />
    </View>
  );
};
