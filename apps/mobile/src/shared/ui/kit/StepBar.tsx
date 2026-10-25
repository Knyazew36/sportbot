import { View } from 'react-native';

import { cn } from '@/shared/lib/utils';

type StepBarProps = {
  total: number;
  /** Текущий шаг, 0-based */
  current: number;
  className?: string;
};

// Прогресс мастера: закрашенные клетки пройденных шагов — порт shared/ui/kit/StepBar.tsx
export const StepBar = ({ total, current, className }: StepBarProps) => (
  <View className={cn('px-gutter flex-row gap-1 pt-2', className)}>
    {Array.from({ length: total }, (_, i) => (
      <View key={i} className={cn('h-1.5 flex-1', i <= current ? 'bg-primary' : 'bg-border')} />
    ))}
  </View>
);
