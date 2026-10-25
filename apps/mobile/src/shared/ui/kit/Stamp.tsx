import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, Keyframe, useReducedMotion, ZoomOut } from 'react-native-reanimated';

import { Poster } from './Typography';

type StampProps = {
  /** Текст штампа; null — штампа нет */
  text: string | null;
};

// Удар печатью: крупно и с поворотом → на место под наклоном -6°. Пружину фронта заменяет кривая с перелётом
const STAMP_IN = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 2.4 }, { rotate: '-14deg' }] },
  70: { opacity: 1, transform: [{ scale: 0.96 }, { rotate: '-5deg' }] },
  100: { opacity: 1, transform: [{ scale: 1 }, { rotate: '-6deg' }] },
}).duration(320);

// Штамп поверх экрана — порт shared/ui/kit/Stamp.tsx: «КРУГ 2 ✓», «СУПЕРСЕТ A ГОТОВ».
// Падает ударом, как печать на бланк, и сам уходит. Сквозной для пальца: под ним уже открывается следующий экран.
// Кладётся последним в экран — absolute на весь родитель
export const Stamp = ({ text }: StampProps) => {
  const still = useReducedMotion();

  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      className="px-gutter absolute inset-0 z-50 items-center justify-center"
    >
      {text ? (
        <Animated.View
          key={text}
          entering={still ? FadeIn.duration(150) : STAMP_IN}
          exiting={still ? FadeOut.duration(150) : ZoomOut.duration(180)}
          style={{ transform: [{ rotate: '-6deg' }] }}
          className="mr-1.5 mb-1.5"
        >
          <View className="bg-sb-blue absolute inset-0 translate-x-1.5 translate-y-1.5" />
          <View className="border-primary bg-background/90 border-4 px-5 py-3">
            <Poster size="2xl" tone="primary" numberOfLines={1} className="text-center">
              {text}
            </Poster>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
};
