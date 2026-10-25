import { View } from 'react-native';
import { X } from 'lucide-react-native';

import { cn } from '@/shared/lib/utils';

import { Icon } from './Icon';
import { Poster, Text } from './Typography';

type StepListProps = {
  items: string[];
  /** Крупнее — когда шаги читают на вытянутой руке посреди упражнения */
  size?: 'md' | 'lg';
};

// Пронумерованные шаги — порт shared/ui/kit/StepList.tsx: техника упражнения, «как делать» у растяжки
export const StepList = ({ items, size = 'md' }: StepListProps) => (
  <View className={cn(size === 'lg' ? 'gap-3' : 'gap-2.5')}>
    {items.map((item, i) => (
      <View key={item} className="flex-row items-baseline gap-2">
        <Poster size={size === 'lg' ? 'md' : 'sm'} tone="primary" numeric className="w-6">
          {String(i + 1)}
        </Poster>
        <Text size={size === 'lg' ? 'lg' : 'md'} className="flex-1">
          {item}
        </Text>
      </View>
    ))}
  </View>
);

// Типичные ошибки — порт MistakeList.tsx: крестики встают в колонку цифр шагов, два списка читаются лесенкой
export const MistakeList = ({ items }: { items: string[] }) => (
  <View className="gap-1.5">
    {items.map((item) => (
      <View key={item} className="flex-row items-start gap-2">
        <View className="w-6 pt-[3px]">
          <Icon as={X} strokeWidth={3.5} className="text-destructive size-3.5" />
        </View>
        <Text tone="soft" className="flex-1">
          {item.charAt(0).toUpperCase() + item.slice(1)}
        </Text>
      </View>
    ))}
  </View>
);
