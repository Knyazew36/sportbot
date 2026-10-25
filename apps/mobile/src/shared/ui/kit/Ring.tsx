import { useEffect } from 'react';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RingProps = {
  value: number;
  size: number;
  stroke?: number;
  /** Плавность хода дуги, как transition во фронте: отсчёт тикает раз в секунду, без неё дуга прыгает */
  transitionMs?: number;
  className?: string;
};

// Кольцо прогресса: value от 0 до 1
export const Ring = ({ value, size, stroke = 6, transitionMs = 1000, className }: RingProps) => {
  const { colors } = useTheme();
  const still = useReducedMotion();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(Math.min(1, Math.max(0, value)));

  useEffect(() => {
    const next = Math.min(1, Math.max(0, value));
    progress.set(still ? next : withTiming(next, { duration: transitionMs, easing: Easing.linear }));
  }, [progress, still, transitionMs, value]);

  const arc = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.value) }));

  return (
    <Svg width={size} height={size} className={cn('-rotate-90', className)}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        stroke={colors.ink}
        opacity={0.14}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        stroke={colors.blue}
        fill="none"
        strokeDasharray={circumference}
        animatedProps={arc}
        strokeLinecap="butt"
      />
    </Svg>
  );
};
