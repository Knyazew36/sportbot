import { useEffect, useMemo, type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { haptic } from '@/shared/lib/haptics';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { BACK_WAVE, FRONT_WAVE, LIVE_H, wavePath } from './constants';
import { Pressable } from '@/shared/ui/kit/Pressable';

type LiveWorkoutBarProps = {
  visible: boolean;
  /** Идёт отдых: полоса абрикосовая */
  resting: boolean;
  /** Название тренировки — для экранного диктора */
  label?: string;
  onReturn: () => void;
  /** Экран под полосой: его верхний отступ от выреза растёт на высоту полосы */
  children: ReactNode;
};

// Порт фронтового LiveWorkoutBar: тренировка идёт, а человек ушёл с фокуса — зелёная полоса сверху возвращает к ней.
// Во время отдыха полоса абрикосовая. Контент опускаем подменой safe-area: Screen и прочие берут отступ оттуда,
// как во фронте всё липкое опускается через --sb-live-h
export const LiveWorkoutBar = ({ visible, resting, label, onReturn, children }: LiveWorkoutBarProps) => {
  const insets = useSafeAreaInsets();
  const shifted = useMemo(() => ({ ...insets, top: insets.top + LIVE_H }), [insets]);

  return (
    <View className="flex-1">
      <SafeAreaInsetsContext.Provider value={visible ? shifted : insets}>{children}</SafeAreaInsetsContext.Provider>
      {visible && <LiveStrip height={shifted.top} resting={resting} label={label} onReturn={onReturn} />}
    </View>
  );
};

type LiveStripProps = Omit<LiveWorkoutBarProps, 'visible' | 'children'> & { height: number };

const LiveStrip = ({ height, resting, label, onReturn }: LiveStripProps) => {
  const { colors } = useTheme();
  const still = useReducedMotion();
  const { width } = useWindowDimensions();
  const base = resting ? colors.rest : colors.live;
  const deep = resting ? colors.restDeep : colors.liveDeep;

  const breath = useSharedValue(0);
  const front = useSharedValue(0);
  const back = useSharedValue(0);
  const sheen = useSharedValue(0);

  useEffect(() => {
    const values = [breath, front, back, sheen];
    if (still) {
      values.forEach((v) => {
        cancelAnimation(v);
        v.set(0);
      });
      return;
    }
    // Перелив медленный и туда-обратно: полоса «дышит», а не мигает
    breath.set(withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.ease) }), -1, true));
    // Волны встречным ходом и с разным шагом — задняя выглядывает из-под передней
    front.set(withRepeat(withTiming(1, { duration: FRONT_WAVE.duration, easing: Easing.linear }), -1, false));
    back.set(withRepeat(withTiming(1, { duration: BACK_WAVE.duration, easing: Easing.linear }), -1, false));
    // Блик: короткий проход и долгая пауза, чтобы не утомлял
    sheen.set(
      withDelay(
        800,
        withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(1, { duration: 2700, easing: Easing.bezier(0.45, 0, 0.25, 1) }),
            withDelay(3300, withTiming(1, { duration: 0 })),
          ),
          -1,
          false,
        ),
      ),
    );
    return () => values.forEach(cancelAnimation);
  }, [still, breath, front, back, sheen]);

  const deepStyle = useAnimatedStyle(() => ({ opacity: 0.75 * breath.value }));
  const backStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -BACK_WAVE.period * back.value }] }));
  const sheenWidth = width / 2;
  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sheenWidth * (-1.2 + 4.4 * sheen.value) }],
  }));

  return (
    <Animated.View
      entering={still ? FadeIn : SlideInUp.duration(220).easing(Easing.out(Easing.cubic))}
      exiting={still ? FadeOut : SlideOutUp.duration(200)}
      className="absolute inset-x-0 top-0 z-[45]"
      style={{ height }}
    >
      {/* Полоса одинакова в любой теме, текст под ней — чёрный */}
      <StatusBar style="dark" />
      <Pressable
        onPress={() => {
          haptic.tap();
          onReturn();
        }}
        accessibilityRole="button"
        accessibilityLabel={label ? `Вернуться к тренировке: ${label}` : 'Вернуться к тренировке'}
        className="flex-1 active:opacity-80"
      >
        <Animated.View
          className="absolute bottom-0 left-0"
          style={[{ height: BACK_WAVE.height, width: width + BACK_WAVE.period }, backStyle]}
        >
          <Svg width={width + BACK_WAVE.period} height={BACK_WAVE.height}>
            <Path d={wavePath(width + BACK_WAVE.period, BACK_WAVE)} fill={deep} />
          </Svg>
        </Animated.View>
        <LiveFill color={base} width={width} front={front} />
        {/* Глубокий слой поверх с дышащей прозрачностью — вместо переливающегося градиента фронта */}
        <Animated.View pointerEvents="none" className="absolute inset-0" style={deepStyle}>
          <LiveFill color={deep} width={width} front={front} />
        </Animated.View>
        {!still && (
          <View pointerEvents="none" className="absolute inset-x-0 top-0 overflow-hidden" style={{ bottom: BACK_WAVE.height }}>
            <Animated.View className="absolute inset-y-0 left-0" style={[{ width: sheenWidth }, sheenStyle]}>
              <Svg width="100%" height="100%">
                <Defs>
                  <LinearGradient id="live-sheen" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0.25" stopColor="#ffffff" stopOpacity={0} />
                    <Stop offset="0.5" stopColor="#ffffff" stopOpacity={0.5} />
                    <Stop offset="0.75" stopColor="#ffffff" stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#live-sheen)" />
              </Svg>
            </Animated.View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

type LiveFillProps = { color: string; width: number; front: SharedValue<number> };

// Тело полосы и передняя волна одним цветом. Волна заходит под тело на 1px, чтобы на дробных пикселях не было щели
const LiveFill = ({ color, width, front }: LiveFillProps) => {
  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: FRONT_WAVE.period * front.value }],
  }));
  return (
    <>
      <View className="absolute inset-x-0 top-0" style={{ bottom: BACK_WAVE.height - 1, backgroundColor: color }} />
      <View className="absolute inset-x-0 overflow-hidden" style={{ bottom: 2, height: FRONT_WAVE.height }}>
        <Animated.View className="absolute top-0" style={[{ left: -FRONT_WAVE.period }, frontStyle]}>
          <Svg width={width + FRONT_WAVE.period} height={FRONT_WAVE.height}>
            <Path d={wavePath(width + FRONT_WAVE.period, FRONT_WAVE)} fill={color} />
          </Svg>
        </Animated.View>
      </View>
    </>
  );
};
