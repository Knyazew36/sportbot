import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';

// Шаг и толщина разметки — как sb-lanes во фронте (repeating-linear-gradient 1.5px / 14px)
const STEP = 14;
const LINE = 1.5;

type LanesProps = {
  /** Дорожки едут: идёт круг суперсета — как sb-lanes-run */
  running?: boolean;
  className?: string;
};

// Беговые дорожки — фирменная разметка блоков, порт утилиты sb-lanes. Прозрачность задаёт className
export const Lanes = ({ running, className }: LanesProps) => {
  const { colors } = useTheme();
  const still = useReducedMotion();
  const shift = useSharedValue(0);

  useEffect(() => {
    if (!running || still) {
      cancelAnimation(shift);
      shift.set(0);
      return;
    }
    shift.set(0);
    shift.set(withRepeat(withTiming(STEP, { duration: 900, easing: Easing.linear }), -1, false));
  }, [running, shift, still]);

  const move = useAnimatedStyle(() => ({ transform: [{ translateX: shift.value }] }));

  return (
    <View pointerEvents="none" className={cn('absolute inset-0 overflow-hidden', className)}>
      {/* Шире экрана на шаг слева: при сдвиге на STEP вправо край не оголяется */}
      <Animated.View className="absolute inset-y-0 right-0" style={[{ left: -STEP }, move]}>
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="sb-lanes" width={STEP} height={STEP} patternUnits="userSpaceOnUse">
              <Rect x={0} y={0} width={LINE} height={STEP} fill={colors.blue} />
            </Pattern>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#sb-lanes)" />
        </Svg>
      </Animated.View>
    </View>
  );
};
