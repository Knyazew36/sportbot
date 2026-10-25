import { Pressable, View } from 'react-native';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';

import { Text } from './Typography';

type SegmentedProps<T extends string> = {
  options: readonly (T | { value: T; label: string })[];
  value: T;
  onValueChange: (value: T) => void;
  /** Растянуть сегменты на всю ширину поровну */
  stretch?: boolean;
};

// Выбор одного из нескольких: пол, режим вопросов, палитра — порт shared/ui/kit/Segmented.tsx.
// Плакатные сегменты с рамкой, выбранный залит чернилами
export const Segmented = <T extends string>({ options, value, onValueChange, stretch }: SegmentedProps<T>) => (
  <View className={cn('flex-row gap-2', stretch ? 'self-stretch' : 'self-start')}>
    {options.map((option) => {
      const { value: v, label } = typeof option === 'string' ? { value: option, label: option } : option;
      const selected = v === value;
      return (
        <Pressable
          key={v}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          onPress={() => {
            haptic.tap();
            onValueChange(v);
          }}
          className={cn(
            'border-foreground h-11 items-center justify-center border-[1.5px] px-4',
            selected ? 'bg-foreground' : 'bg-background active:bg-mist',
            stretch && 'flex-1',
          )}
        >
          <Text
            className={cn(
              'font-display text-[15px] leading-[16.5px] tracking-[0.15px] uppercase',
              selected ? 'text-background' : 'text-foreground',
            )}
          >
            {label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);
