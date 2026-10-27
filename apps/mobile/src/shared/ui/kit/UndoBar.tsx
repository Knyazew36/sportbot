import { useEffect, useState, useSyncExternalStore } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Undo2 } from 'lucide-react-native';

import { useTheme } from '@/shared/theme/ThemeProvider';

import { Button } from './Button';
import { Lanes } from './Patterns';
import { Text } from './Typography';
import { undoBar, type UndoItem } from './undo-bar';

/** Смахнули дальше — плашка уходит без отмены */
const SWIPE_AWAY = 80;

type UndoBarProps = {
  /** Отступ от низа экрана: над нижним меню или над жестовой полосой — решает оболочка */
  bottom: number;
};

// Отмена последней правки — порт shared/ui/kit/UndoBar.tsx: чёрная плашка у большого пальца, над нижним меню.
// Снизу тает дорожка — видно, сколько осталось до отправки. Подключается один раз в оболочке; показывают через undoBar.show
export const UndoBar = ({ bottom }: UndoBarProps) => {
  const item = useSyncExternalStore(undoBar.subscribe, undoBar.get);
  const still = useReducedMotion();

  return (
    <View pointerEvents="box-none" className="px-gutter absolute inset-x-0 z-50" style={{ bottom }}>
      {item ? (
        <Animated.View
          key={item.id}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          entering={still ? FadeIn.duration(150) : FadeInDown.springify().stiffness(520).damping(36)}
          exiting={still ? FadeOut.duration(150) : FadeOutDown.duration(180)}
          className="mr-[3px] mb-[3px]"
        >
          <Swipeable id={item.id} enabled={!still}>
            <Plate item={item} />
          </Swipeable>
        </Animated.View>
      ) : null}
    </View>
  );
};

const close = (id: number) => undoBar.close(id);

// Смахивание вбок — drag="x" фронта: дальше порога плашка уходит, ближе — пружиной на место
const Swipeable = ({ id, enabled, children }: { id: number; enabled: boolean; children: React.ReactNode }) => {
  const x = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      x.set(e.translationX * 0.6);
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_AWAY) scheduleOnRN(close, id);
      else x.set(withSpring(0));
    });

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <GestureDetector gesture={pan}>
      <View collapsable={false}>
        <Animated.View style={style}>{children}</Animated.View>
      </View>
    </GestureDetector>
  );
};

const Plate = ({ item }: { item: UndoItem }) => {
  const { colors } = useTheme();
  // Плашка могла смонтироваться не в момент показа: дорожка стартует с уже прошедшей доли
  const [lane] = useState(() => {
    const rest = Math.max(0, item.startedAt + item.timeout - Date.now());
    return { from: rest / item.timeout, duration: rest };
  });
  const progress = useSharedValue(lane.from);

  useEffect(() => {
    progress.set(withTiming(0, { duration: lane.duration, easing: Easing.linear }));
  }, [lane, progress]);

  const melt = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));

  return (
    <View>
      <View className="bg-sb-blue absolute inset-0 translate-x-[3px] translate-y-[3px]" />
      <View className="bg-foreground flex-row items-center gap-3 overflow-hidden py-2.5 pr-2.5 pl-4">
        <Lanes color={colors.paper} opacity={0.1} />
        <Text size="sm" medium tone="inverse" className="min-w-0 flex-1 leading-[17px]">
          {item.title}
        </Text>
        <Button variant="paper" size="sm" icon={Undo2} onPress={() => undoBar.undo(item.id)}>
          Отменить
        </Button>
        {/* Дорожка тает до нуля за всё время плашки */}
        <Animated.View
          className="bg-primary absolute inset-x-0 bottom-0 h-[3px]"
          style={[{ transformOrigin: 'left' }, melt]}
        />
      </View>
    </View>
  );
};
