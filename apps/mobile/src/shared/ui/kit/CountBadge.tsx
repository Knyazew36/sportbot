import { Text, View } from 'react-native';

import { cn } from '@/shared/lib/utils';

type CountBadgeProps = {
  count: number;
  className?: string;
};

// Счётчик в углу кнопки — порт shared/ui/kit/CountBadge.tsx: «Фильтры · 2», «Мои · 5».
// Кладётся рядом с кнопкой в обёртку: позиция absolute от неё. Ноль не показываем, больше 99 — «99+»
export const CountBadge = ({ count, className }: CountBadgeProps) =>
  count > 0 ? (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      className={cn(
        'bg-primary border-foreground absolute -top-2 -right-2 h-5 min-w-5 items-center justify-center border-[1.5px] px-1',
        className,
      )}
    >
      <Text className="font-display text-primary-foreground text-[11px] leading-[12px]">
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  ) : null;
