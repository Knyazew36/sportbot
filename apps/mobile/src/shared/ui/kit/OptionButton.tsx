import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Check } from 'lucide-react-native';

import { cn } from '@/shared/lib/utils';

import { Button } from './Button';
import { Icon } from './Icon';
import { Poster, Text } from './Typography';

type OptionButtonProps = {
  /** Буква комплекса или другой крупный знак слева */
  mark?: ReactNode;
  title: string;
  meta?: ReactNode;
  /** Выбранный вариант залит и отмечен галочкой */
  selected?: boolean;
  onPress?: () => void;
  className?: string;
};

// Кнопка-вариант в списке выбора: комплекс в шторке, программа при первом запуске — порт OptionButton.tsx.
// Название в одну строку с многоточием, подпись под ним отдельной строкой — не слипаются и не режутся
export const OptionButton = ({ mark, title, meta, selected, onPress, className }: OptionButtonProps) => (
  <Button
    variant={selected ? 'default' : 'outline'}
    size="lg"
    block
    onPress={onPress}
    className={className}
    contentClassName="min-h-[60px] justify-start gap-4 py-2.5"
  >
    {mark != null && (
      <Poster size="xl" className={cn('w-7 text-center', !selected && 'text-primary')}>
        {mark}
      </Poster>
    )}
    <View className="min-w-0 flex-1 gap-0.5">
      <Poster size="sm" numberOfLines={1}>
        {title}
      </Poster>
      {meta ? (
        <Text size="2xs" numberOfLines={1} className="opacity-70">
          {meta}
        </Text>
      ) : null}
    </View>
    <Icon as={Check} strokeWidth={3} className={cn('size-5', !selected && 'opacity-0')} />
  </Button>
);
