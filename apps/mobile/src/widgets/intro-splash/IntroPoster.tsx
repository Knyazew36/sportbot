import { createContext, useContext, useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { fonts } from '@/shared/theme/fonts';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { track } from './timeline';
import { Pressable } from '@/shared/ui/kit/Pressable';

const WORD = 'СПОРТБОТ';
const BEATS = ['СИЛА', 'ТЕМП', 'ПРОГРЕСС'];
const TAPE = 'СИЛА · ТЕМП · ПРОГРЕСС · ';
const STRIPES = 6;

// Таймлайн в секундах. Ритм как у монтажа спортивного ролика: шторка → три склейки → логотип
const T = {
  shutterIn: 0,
  beats: 0.55,
  beat: 0.36,
  shutterOut: 1.7,
  logo: 1.85,
  out: 3.25,
  done: 3.85,
};

const EASE = Easing.bezierFn(0.76, 0, 0.24, 1);
const RISE = Easing.bezierFn(0.2, 0.8, 0.2, 1);
// Свои кривые идут в useAnimatedStyle — нужна пометка worklet, как у Easing reanimated
const LINEAR = (x: number) => {
  'worklet';
  return x;
};

type Roles = {
  bg: string;
  shutter: string;
  beat: string;
  logo: string;
  shadow: string;
  tape: string;
  tapeText: string;
};

type Ctx = { roles: Roles; t: SharedValue<number>; width: number; height: number };

const IntroContext = createContext<Ctx | null>(null);

const useIntro = () => {
  const ctx = useContext(IntroContext);
  if (!ctx) throw new Error('useIntro вне IntroPoster');
  return ctx;
};

// Шторка из вертикальных полос: падают сверху лесенкой и уходят вниз так же лесенкой
const Stripe = ({ index }: { index: number }) => {
  const { roles, t, height } = useIntro();
  const lag = index * 0.05;
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          height *
          track(
            t.value,
            [T.shutterIn + lag, T.shutterIn + lag + 0.45, T.shutterOut + lag, T.shutterOut + lag + 0.45],
            [-1.01, 0, 0, 1.01],
            [EASE, LINEAR, EASE],
          ),
      },
    ],
  }));
  return <Animated.View className="-ml-px h-full flex-1" style={[{ backgroundColor: roles.shutter }, style]} />;
};

// Слово-склейка: выезжает снизу из-под маски, держится долю секунды и уходит вверх
const Beat = ({ word, index }: { word: string; index: number }) => {
  const { roles, t, width } = useIntro();
  const start = T.beats + index * T.beat;
  const size = Math.min(width / 4.4, 220);
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          size *
          track(
            t.value,
            [start, start + 0.14, start + T.beat - 0.08, start + T.beat + 0.06],
            [1.1, 0, 0, -1.1],
            [EASE, LINEAR, EASE],
          ),
      },
    ],
  }));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} className="items-center justify-center">
      {/* Маска ровно по слову: иначе сдвинутое вниз слово остаётся видно на экране */}
      <View className="overflow-hidden" style={{ height: size * 1.06 }}>
        <Animated.Text
          numberOfLines={1}
          style={[{ color: roles.beat, fontSize: size, lineHeight: size * 1.06, fontFamily: fonts.display }, style]}
        >
          {word}
        </Animated.Text>
      </View>
    </View>
  );
};

// Наклонная лента с бегущим текстом под логотипом — плакатный акцент. Открывается слева и уходит вправо — clip-path фронта
const Tape = () => {
  const { roles, t, width, height } = useIntro();
  const tapeWidth = width * 1.6;
  const [textWidth, setTextWidth] = useState(0);
  const run = useSharedValue(0);

  useEffect(() => {
    run.set(withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false));
  }, [run]);

  const clip = useAnimatedStyle(() => {
    const times = [T.logo - 0.05, T.logo + 0.45, T.out - 0.05, T.out + 0.35];
    const right = track(t.value, times, [1, 0, 0, 0], [EASE, LINEAR, EASE]);
    const left = track(t.value, times, [0, 0, 0, 1], [EASE, LINEAR, EASE]);
    return { left: left * tapeWidth, width: Math.max(0, 1 - left - right) * tapeWidth };
  });
  const inner = useAnimatedStyle(() => ({
    transform: [
      { translateX: -track(t.value, [T.out - 0.05, T.out + 0.35], [0, 1], [EASE]) * tapeWidth },
      { translateX: -run.value * textWidth },
    ],
  }));

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: height * 0.68,
        left: (width - tapeWidth) / 2,
        width: tapeWidth,
        height: 44,
        marginTop: -22,
        transform: [{ rotate: '-7deg' }],
      }}
    >
      <Animated.View className="absolute inset-y-0 overflow-hidden" style={[{ backgroundColor: roles.tape }, clip]}>
        <Animated.View className="w-[9999px] flex-row py-2" style={inner}>
          {[0, 1].map((i) => (
            <Animated.Text
              key={i}
              numberOfLines={1}
              onLayout={i === 0 ? (e) => setTextWidth(e.nativeEvent.layout.width) : undefined}
              style={{ color: roles.tapeText, fontFamily: fonts.display, fontSize: 20, lineHeight: 26 }}
            >
              {TAPE.repeat(8)}
            </Animated.Text>
          ))}
        </Animated.View>
      </Animated.View>
    </View>
  );
};

// Буква логотипа: поднимается из-под маски, затем отбрасывает жёсткую тень — копией буквы со сдвигом,
// как кнопки приложения (text-shadow в RN на UI-потоке не анимируется)
const Letter = ({ letter, index, size }: { letter: string; index: number; size: number }) => {
  const { roles, t } = useIntro();
  const rise = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          size *
          track(
            t.value,
            [T.logo + index * 0.045, T.logo + index * 0.045 + 0.5, T.logo + 0.95, T.out + index * 0.03 + 0.3],
            [1.1, 0, 0, -1.1],
            [EASE, RISE, EASE],
          ),
      },
    ],
  }));
  const shadow = useAnimatedStyle(() => {
    const press = track(t.value, [T.logo + index * 0.045 + 0.5, T.logo + 0.95], [0, 6], [RISE]);
    return { transform: [{ translateX: press }, { translateY: press }] };
  });
  const text = { fontSize: size, lineHeight: size * 1.1, fontFamily: fonts.display };

  return (
    <View className="overflow-hidden px-[2px]" style={{ height: size * 1.1 + 6 }}>
      <Animated.View style={rise}>
        <Animated.Text style={[text, { color: roles.shadow, position: 'absolute' }, shadow]}>{letter}</Animated.Text>
        <Animated.Text style={[text, { color: roles.logo }]}>{letter}</Animated.Text>
      </Animated.View>
    </View>
  );
};

const Logo = () => {
  const { roles, t, width } = useIntro();
  const size = Math.min(width / 4.8, 170);
  const line = useAnimatedStyle(() => ({
    width: track(t.value, [T.logo + 0.5, T.logo + 0.9, T.out, T.out + 0.3], [0, 40, 40, 0], [EASE, LINEAR, EASE]),
  }));
  const caption = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          18 * track(t.value, [T.logo + 0.55, T.logo + 0.95, T.out, T.out + 0.3], [1.2, 0, 0, -1.2], [EASE, LINEAR, EASE]),
      },
    ],
  }));

  return (
    <View className="items-center">
      <View className="flex-row">
        {WORD.split('').map((letter, i) => (
          <Letter key={i} letter={letter} index={i} size={size} />
        ))}
      </View>
      <View className="mt-3 flex-row items-center gap-3 overflow-hidden">
        <Animated.View className="h-[2px]" style={[{ backgroundColor: roles.logo }, line]} />
        <Animated.Text
          style={[
            { color: roles.logo, fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 18, letterSpacing: 4.2 },
            caption,
          ]}
        >
          ТРЕНИРОВКИ
        </Animated.Text>
      </View>
    </View>
  );
};

type Props = {
  onDone: () => void;
};

// Заставка «кинетический плакат» — порт widgets/intro-splash/IntroPoster.tsx: шторка, три быстрых слова-склейки,
// логотип с жёсткой тенью. Весь ролик — один прогресс t (секунды), каждый слой считает своё положение от него.
// Кладётся последним в корень экрана — absolute поверх всего. Тап пропускает
export const IntroPoster = ({ onDone }: Props) => {
  const { colors, scheme } = useTheme();
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);

  // Тёмная: ночной фон темы, акцентная шторка, светлые буквы с акцентной тенью.
  // Светлая: без белого фона — плакат на акцентном цвете, чернильная шторка и тень
  const roles: Roles =
    scheme === 'dark'
      ? { bg: colors.paper, shutter: colors.blue, beat: colors.paper, logo: colors.ink, shadow: colors.blue, tape: colors.blue, tapeText: colors.paper }
      : { bg: colors.blue, shutter: colors.ink, beat: colors.paper, logo: colors.paper, shadow: colors.ink, tape: colors.ink, tapeText: colors.paper };

  useEffect(() => {
    t.set(withTiming(T.done, { duration: T.done * 1000, easing: Easing.linear }));
    const id = setTimeout(onDone, T.done * 1000);
    return () => clearTimeout(id);
  }, [onDone, t]);

  const fade = useAnimatedStyle(() => ({ opacity: track(t.value, [T.out + 0.3, T.done], [1, 0], [Easing.out(Easing.ease)]) }));

  return (
    <IntroContext.Provider value={{ roles, t, width, height }}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: roles.bg, zIndex: 1000 }, fade]}
        className="overflow-hidden"
      >
        <Pressable accessibilityRole="button" accessibilityLabel="Пропустить заставку" onPress={onDone} style={StyleSheet.absoluteFill}>
          <Tape />
          <View style={StyleSheet.absoluteFill} className="items-center justify-center">
            <Logo />
          </View>
          <View pointerEvents="none" style={StyleSheet.absoluteFill} className="flex-row">
            {Array.from({ length: STRIPES }, (_, i) => (
              <Stripe key={i} index={i} />
            ))}
          </View>
          {BEATS.map((word, i) => (
            <Beat key={word} word={word} index={i} />
          ))}
        </Pressable>
      </Animated.View>
    </IntroContext.Provider>
  );
};
