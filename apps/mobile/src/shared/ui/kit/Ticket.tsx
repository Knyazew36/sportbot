import type { ReactNode } from 'react';
import { View } from 'react-native';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';

import { Eyebrow, Poster, Text } from './Typography';
import { Pressable } from './Pressable';

type TicketProps = {
  /** Буква комплекса */
  mark: ReactNode;
  /** Подпись над буквой — что это за билет, например «Тренировка» */
  kicker?: ReactNode;
  title: ReactNode;
  /** Следующий по очереди — подсвечен */
  active?: boolean;
  /** Билет нажимается — например, открывает состав комплекса */
  onPress?: () => void;
  children?: ReactNode;
};

// Комплекс в очереди — как билет с вырезом корешка. Порт shared/ui/kit/Ticket.tsx.
// Нажимаемый билет получает жёсткую тень, как у кнопок: тень — признак «сюда можно тыкать»
export const Ticket = ({ mark, kicker, title, active, onPress, children }: TicketProps) => {
  const card = (pressed: boolean) => (
    <View
      className={cn(
        'bg-background w-[152px] gap-6 border-[1.5px] p-3',
        active ? 'border-primary' : 'border-border',
        pressed && 'translate-x-[3px] translate-y-[3px]',
      )}
    >
      {/* accent полупрозрачный: прямо на карточке сквозь него проступала бы синяя тень, и буква сливалась с фоном */}
      {active ? <View className="bg-accent absolute inset-0" /> : null}
      {/* Вырез корешка справа */}
      <View
        className={cn(
          'bg-background absolute top-1/2 -right-[7px] -mt-1.5 size-3 rounded-full border-[1.5px]',
          active ? 'border-primary' : 'border-border',
        )}
      />
      <View className="gap-1">
        {kicker ? (
          <Eyebrow size="sm" tone={active ? 'primary' : 'muted'}>
            {kicker}
          </Eyebrow>
        ) : null}
        <Poster size="2xl" tone={active ? 'primary' : 'faint'}>
          {mark}
        </Poster>
      </View>
      <View className="gap-1.5">
        <Text size="sm">{title}</Text>
        {children}
      </View>
    </View>
  );

  if (!onPress) return card(false);

  return (
    <Pressable
      accessibilityRole="button"
      className="mr-[3px] mb-[3px]"
      onPress={() => {
        haptic.tap();
        onPress();
      }}
    >
      {({ pressed }) => (
        <View>
          <View className={cn('absolute inset-0 translate-x-[3px] translate-y-[3px]', active ? 'bg-sb-blue' : 'bg-sb-ink')} />
          {card(pressed)}
        </View>
      )}
    </Pressable>
  );
};
