import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/shared/lib/utils';

import { Eyebrow, Poster } from './Typography';

type Stat = { label: string; value: ReactNode };

type StatGridProps = {
  items: Stat[];
  /** В рамке — итоговая плашка; без рамки — строка показателей между линейками */
  framed?: boolean;
  className?: string;
};

// Строка показателей «число над подписью» — порт shared/ui/kit/StatGrid.tsx.
// Колонки делят ширину по содержимому: длинные подписи вроде «упражнений» не вылезают из ячейки
export const StatGrid = ({ items, framed, className }: StatGridProps) => (
  <View
    className={cn(
      'flex-row',
      framed ? 'border-foreground/80 border-[1.5px]' : 'border-border border-y-[1.5px]',
      className,
    )}
  >
    {items.map((s, i) => (
      <View
        key={s.label}
        className={cn(
          // Зазор между цифрой и подписью задан здесь, а не межстрочным: при плотной строке они слипались
          'grow gap-2 py-3',
          framed ? 'px-2.5' : i > 0 && 'pl-3',
          i > 0 && 'border-l-[1.5px]',
          framed ? 'border-foreground/80' : 'border-border',
        )}
      >
        <Poster size="xl" numberOfLines={1} className="leading-[34px]">
          {s.value}
        </Poster>
        <Eyebrow numberOfLines={1} className="tracking-[0.88px]">
          {s.label}
        </Eyebrow>
      </View>
    ))}
  </View>
);
