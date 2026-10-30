import { View } from 'react-native';

import { cn } from '@/shared/lib/utils';

type StretchProgressProps = {
  ids: number[];
  current: number;
  done: ReadonlySet<number>;
  mainCount: number;
};

// Текущая залита, пройденные бледнее: к растяжке можно перейти из списка, поэтому «всё слева пройдено» было бы враньём.
// «Если есть время» — пунктиром
export const StretchProgress = ({ ids, current, done, mainCount }: StretchProgressProps) => (
  <View className="flex-row gap-1 px-gutter pt-3">
    {ids.map((id, i) => (
      <View
        key={id}
        className={cn(
          'h-1 flex-1',
          i === current
            ? 'bg-primary'
            : done.has(id)
              ? 'bg-primary/50'
              : i < mainCount
                ? 'bg-border'
                : 'border-border border-t-2 border-dashed',
        )}
      />
    ))}
  </View>
);
