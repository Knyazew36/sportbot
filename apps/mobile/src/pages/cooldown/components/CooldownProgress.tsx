import { View } from 'react-native';

import { cn } from '@/shared/lib/utils';

type CooldownProgressProps = {
  ids: number[];
  current: number;
  mainCount: number;
};

// Пройденные и текущая залиты, «если есть время» — пунктиром
export const CooldownProgress = ({ ids, current, mainCount }: CooldownProgressProps) => (
  <View className="flex-row gap-1 px-gutter pt-3">
    {ids.map((id, i) => (
      <View
        key={id}
        className={cn(
          'h-1 flex-1',
          i <= current ? 'bg-primary' : i < mainCount ? 'bg-border' : 'border-border border-t-2 border-dashed',
        )}
      />
    ))}
  </View>
);
