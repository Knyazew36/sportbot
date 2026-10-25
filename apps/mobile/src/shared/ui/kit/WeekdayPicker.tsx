import { Pressable, View } from 'react-native';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';
import { WEEKDAYS } from '@/shared/lib/weekdays';

import { Eyebrow } from './Typography';

type WeekdayPickerProps = {
  /** Дни 0..6, 0 — воскресенье */
  value: number[];
  onValueChange: (value: number[]) => void;
};

// Тренировочные дни — порт ToggleGroup на 7 колонок из расписания фронта: неделя в одну строку,
// выбранный день залит чернилами, как сегмент
export const WeekdayPicker = ({ value, onValueChange }: WeekdayPickerProps) => (
  <View accessibilityLabel="Тренировочные дни" className="flex-row gap-1.5">
    {WEEKDAYS.map((day) => {
      const selected = value.includes(day.value);
      return (
        <Pressable
          key={day.value}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          onPress={() => {
            haptic.tap();
            onValueChange(selected ? value.filter((v) => v !== day.value) : [...value, day.value].sort());
          }}
          className={cn(
            'border-foreground h-11 flex-1 items-center justify-center border-[1.5px]',
            selected ? 'bg-foreground' : 'bg-background active:bg-mist',
          )}
        >
          <Eyebrow className={cn('font-display', selected ? 'text-background' : 'text-foreground')}>{day.short}</Eyebrow>
        </Pressable>
      );
    })}
  </View>
);
