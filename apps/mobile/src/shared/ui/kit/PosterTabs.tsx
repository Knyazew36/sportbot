import { useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, withSpring } from 'react-native-reanimated';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';

import { Poster, Text } from './Typography';
import { Pressable } from './Pressable';

type PosterTabsProps<T extends string> = {
  tabs: readonly { value: T; label: string }[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
};

// Разделы экрана как оглавление из глав — порт shared/ui/kit/PosterTabs.tsx: одна рамка с жёсткой тенью,
// равные ячейки «01 / ПРОГРЕСС». Выбранная глава залита «чернилами», заливка переезжает пружиной.
// Нарочно не похожи на Segmented: под ними стоит переключатель периода, два ряда одинаковых кнопок читались бы как один выбор
export const PosterTabs = <T extends string>({ tabs, value, onValueChange, className }: PosterTabsProps<T>) => {
  const still = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    tabs.findIndex((t) => t.value === value),
  );
  const cell = tabs.length ? width / tabs.length : 0;

  // Заливка одна на всю рамку и ездит под ячейками — layoutId фронта
  const fill = useAnimatedStyle(() => ({
    width: cell,
    transform: [{ translateX: still ? index * cell : withSpring(index * cell, { stiffness: 520, damping: 38 }) }],
  }));

  return (
    <View className={cn('mr-[3px] mb-[3px]', className)}>
      <View className="bg-sb-ink absolute inset-0 translate-x-[3px] translate-y-[3px]" />
      <View
        accessibilityRole="tablist"
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        className="border-foreground bg-background flex-row overflow-hidden border-[1.5px]"
      >
        {width > 0 && <Animated.View className="bg-foreground absolute inset-y-0 left-0" style={fill} />}
        {tabs.map((tab, i) => {
          const active = tab.value === value;
          return (
            <Pressable
              key={tab.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (active) return;
                haptic.tap();
                onValueChange(tab.value);
              }}
              className={cn(
                'min-w-0 flex-1 items-start gap-1 px-2.5 pt-2 pb-2.5',
                i > 0 && 'border-foreground/80 border-l-[1.5px]',
                !active && 'active:bg-mist',
              )}
            >
              <Text className="text-primary text-[10.5px] leading-[10.5px] tracking-[1.47px]">
                {String(i + 1).padStart(2, '0')}
              </Text>
              <Poster
                numberOfLines={1}
                className={cn('text-[19px] leading-[21px]', active ? 'text-background' : 'text-foreground/45')}
              >
                {tab.label}
              </Poster>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
