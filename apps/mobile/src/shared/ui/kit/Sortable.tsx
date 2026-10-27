import { useEffect, useState, type Key, type ReactNode } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';

type SortableProps<T> = {
  items: readonly T[];
  keyOf: (item: T) => Key;
  /** y — список строк, x — лента карточек (прокрутку вбок даёт ScrollView снаружи) */
  axis?: 'x' | 'y';
  /** Зазор между элементами, px — тот же, что gap у раскладки */
  gap?: number;
  /** Элемент отпустили — новый порядок ключей. Сам список порядок не хранит: его приносит родитель */
  onReorder: (keys: Key[]) => void;
  /** handle оборачивает ручку: тянется только за неё, иначе прокрутка и ввод в поля хватали бы строку */
  renderItem: (item: T, handle: (child: ReactNode) => ReactNode, index: number) => ReactNode;
  /** Хвост после элементов, не перетаскивается: «+ Добавить» в ленте */
  footer?: ReactNode;
  className?: string;
};

// Перестановка элементов за ручку — замена Reorder из motion фронта. Тянутый элемент едет за пальцем
// с синей жёсткой тенью (whileDrag фронта), соседи расступаются. Порядок отдаётся наверх один раз — при отпускании
export const Sortable = <T,>({
  items,
  keyOf,
  axis = 'y',
  gap = 0,
  onReorder,
  renderItem,
  footer,
  className,
}: SortableProps<T>) => {
  const sizes = useSharedValue<number[]>([]);
  const active = useSharedValue(-1);
  const target = useSharedValue(-1);
  const offset = useSharedValue(0);
  const [dragging, setDragging] = useState(-1);
  const order = items.map(keyOf).join('|');

  // Новый порядок пришёл от родителя — элементы уже на своих местах, сдвиги больше не нужны
  useEffect(() => {
    active.set(-1);
    target.set(-1);
    offset.set(0);
  }, [order, active, target, offset]);

  const keys = items.map(keyOf);

  const finish = (from: number, to: number) => {
    setDragging(-1);
    if (from < 0 || to < 0 || from === to) {
      active.set(-1);
      offset.set(0);
      return;
    }
    haptic.tap();
    const next = [...keys];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    onReorder(next);
  };

  const start = (index: number) => {
    haptic.tap();
    setDragging(index);
  };

  return (
    <View className={cn(axis === 'x' ? 'flex-row' : 'flex-col', className)} style={{ gap }}>
      {items.map((item, index) => (
        <SortableItem
          key={keyOf(item)}
          index={index}
          axis={axis}
          gap={gap}
          sizes={sizes}
          active={active}
          target={target}
          offset={offset}
          dragging={dragging === index}
          onStart={start}
          onFinish={finish}
        >
          {(handle) => renderItem(item, handle, index)}
        </SortableItem>
      ))}
      {footer}
    </View>
  );
};

type SortableItemProps = {
  index: number;
  axis: 'x' | 'y';
  gap: number;
  sizes: SharedValue<number[]>;
  active: SharedValue<number>;
  target: SharedValue<number>;
  offset: SharedValue<number>;
  dragging: boolean;
  onStart: (index: number) => void;
  onFinish: (from: number, to: number) => void;
  children: (handle: (child: ReactNode) => ReactNode) => ReactNode;
};

const SortableItem = ({
  index,
  axis,
  gap,
  sizes,
  active,
  target,
  offset,
  dragging,
  onStart,
  onFinish,
  children,
}: SortableItemProps) => {
  const { colors } = useTheme();

  const pan = Gesture.Pan()
    .minDistance(0)
    .onStart(() => {
      active.set(index);
      target.set(index);
      offset.set(0);
      scheduleOnRN(onStart, index);
    })
    .onUpdate((e) => {
      const moved = axis === 'x' ? e.translationX : e.translationY;
      offset.set(moved);
      // Куда встанет: по центру тянутого элемента среди мест в исходном порядке
      const list = sizes.value;
      let begin = 0;
      for (let i = 0; i < index; i++) begin += (list[i] ?? 0) + gap;
      const center = begin + (list[index] ?? 0) / 2 + moved;
      let edge = 0;
      let to = list.length - 1;
      for (let i = 0; i < list.length; i++) {
        edge += (list[i] ?? 0) + gap;
        if (center < edge) {
          to = i;
          break;
        }
      }
      target.set(Math.max(0, to));
    })
    .onEnd(() => {
      const from = active.value;
      const to = target.value;
      // Встаёт на новое место пружиной, родитель тем временем переставит список
      let shift = 0;
      const list = sizes.value;
      if (to > from) for (let i = from + 1; i <= to; i++) shift += (list[i] ?? 0) + gap;
      else for (let i = to; i < from; i++) shift -= (list[i] ?? 0) + gap;
      offset.set(withSpring(shift, { stiffness: 520, damping: 40 }));
      scheduleOnRN(onFinish, from, to);
    });

  const style = useAnimatedStyle(() => {
    const from = active.value;
    const to = target.value;
    const self = from === index;
    let shift = 0;
    if (from >= 0 && !self) {
      const moved = (sizes.value[from] ?? 0) + gap;
      if (index > from && index <= to) shift = -moved;
      else if (index < from && index >= to) shift = moved;
    }
    const along = self ? offset.value : from < 0 ? 0 : withTiming(shift, { duration: 180 });
    return {
      zIndex: self ? 10 : 0,
      transform: [
        axis === 'x' ? { translateX: along } : { translateY: along },
        { scale: self ? withTiming(1.02, { duration: 120 }) : 1 },
      ],
    };
  });

  const handle = (child: ReactNode) => (
    <GestureDetector gesture={pan}>
      <View collapsable={false}>{child}</View>
    </GestureDetector>
  );

  return (
    <Animated.View
      onLayout={(e) => {
        const size = axis === 'x' ? e.nativeEvent.layout.width : e.nativeEvent.layout.height;
        const next = [...sizes.value];
        next[index] = size;
        sizes.set(next);
      }}
      style={[style, dragging && { boxShadow: `6px 6px 0 ${colors.blue}` },{flex:1}]}
    >
      {children(handle)}
    </Animated.View>
  );
};
