import type { Key, ReactNode } from 'react';
import { View } from 'react-native';

import { chunk, cn } from '@/shared/lib/utils';

type GridProps<T> = {
  items: readonly T[];
  columns: number;
  keyOf: (item: T) => Key;
  children: (item: T) => ReactNode;
  className?: string;
};

// Сетка равных ячеек — замена CSS grid-cols-N фронта: ряды с flex-1.
// Неполный последний ряд добивается пустыми ячейками, чтобы кнопки не растягивались шире соседей
export const Grid = <T,>({ items, columns, keyOf, children, className }: GridProps<T>) => (
  <View className={cn('gap-2', className)}>
    {chunk(items, columns).map((row, r) => (
      <View key={r} className="flex-row gap-2">
        {row.map((item) => (
          <View key={keyOf(item)} className="min-w-0 flex-1">
            {children(item)}
          </View>
        ))}
        {Array.from({ length: columns - row.length }, (_, i) => (
          <View key={`pad-${i}`} className="flex-1" />
        ))}
      </View>
    ))}
  </View>
);
