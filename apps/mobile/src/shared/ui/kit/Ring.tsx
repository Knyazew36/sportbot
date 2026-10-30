import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RingProps = {
  value: number;
  size: number;
  stroke?: number;
  /**
   * Таймер идёт: дуга сама едет от value к to и приходит ровно через ms.
   * Нет — дуга стоит на value: пауза и остановка замирают сразу, без доезда
   */
  sweep?: { to: number; ms: number };
  /** Цвет дуги, если экран не синий: разминка */
  bar?: string;
  className?: string;
};

const clamp = (n: number) => Math.min(1, Math.max(0, n));

// Кольцо прогресса: value от 0 до 1
export const Ring = ({ value, size, stroke = 6, sweep, bar, className }: RingProps) => {
  const { colors } = useTheme();
  const still = useReducedMotion();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(clamp(value));
  const to = sweep ? clamp(sweep.to) : null;
  const ms = sweep?.ms ?? 0;

  useEffect(() => {
    // Раньше дуга догоняла каждый тик анимацией и доезжала её уже после паузы. Теперь ход задаётся до конца
    // отсчёта: на тике он лишь сверяется с часами, а без sweep анимация обрывается на месте
    cancelAnimation(progress);
    if (to === null || still) {
      progress.set(clamp(value));
      return;
    }
    progress.set(
      withSequence(
        withTiming(clamp(value), { duration: 0 }),
        withTiming(to, { duration: Math.max(0, ms), easing: Easing.linear }),
      ),
    );
  }, [ms, progress, still, to, value]);

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
        stroke={bar ?? colors.blue}
        fill="none"
        strokeDasharray={circumference}
        animatedProps={arc}
        strokeLinecap="butt"
      />
    </Svg>
  );
};
