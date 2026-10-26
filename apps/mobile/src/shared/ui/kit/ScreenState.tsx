import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { CloudOff, type LucideIcon } from 'lucide-react-native';

import { cn } from '@/shared/lib/utils';

import { EmptyState } from './EmptyState';
import { Icon } from './Icon';
import { Poster, Text } from './Typography';

type ScreenStateProps = {
  state: 'loading' | 'empty' | 'error';
  title?: string;
  description?: ReactNode;
  /** «Повторить» для ошибки, подсказка-действие для пустого списка */
  action?: ReactNode;
  /** Иконка ошибки; у пустоты иконки нет */
  icon?: LucideIcon;
  /** Сколько строк-скелетов показать при загрузке */
  rows?: number;
  className?: string;
};

const DEFAULTS = {
  empty: { title: 'Пока пусто', description: 'Здесь появятся записи.' },
  error: {
    icon: CloudOff,
    title: 'Нет связи',
    description: 'Не получилось загрузить. Проверь интернет и попробуй ещё раз.',
  },
};

/** Заглушка строки при загрузке — Skeleton из shadcn фронта: мерцает, пока данных нет */
export const Skeleton = ({ className }: { className?: string }) => {
  const still = useReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (still) return;
    pulse.set(withRepeat(withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, [pulse, still]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return <Animated.View className={cn('bg-mist', className)} style={style} />;
};

// Три обязательных состояния списка и экрана данных — порт shared/ui/kit/ScreenState.tsx.
// Загрузка повторяет форму списка строками, а не крутит абстрактный спиннер
export const ScreenState = ({ state, title, description, action, icon, rows = 4, className }: ScreenStateProps) => {
  if (state === 'loading') {
    return (
      <View
        accessibilityLabel="Загрузка"
        accessibilityState={{ busy: true }}
        className={cn('border-border border-t-[1.5px]', className)}
      >
        {Array.from({ length: rows }, (_, i) => (
          <View key={i} className="border-border flex-row items-center gap-3 border-b-[1.5px] py-3.5">
            <Skeleton className="size-14 shrink-0" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (state === 'empty') {
    return (
      <EmptyState
        title={title ?? DEFAULTS.empty.title}
        description={description ?? DEFAULTS.empty.description}
        action={action}
        className={className}
      />
    );
  }

  const StateIcon = icon ?? DEFAULTS.error.icon;
  const text = description ?? DEFAULTS.error.description;

  return (
    <View
      accessibilityRole="alert"
      className={cn('border-destructive/60 items-start gap-3 border-[1.5px] border-dashed p-5', className)}
    >
      <View className="bg-background border-destructive size-12 items-center justify-center border-[1.5px]">
        <Icon as={StateIcon} className="text-destructive size-6" />
      </View>
      <View className="bg-background gap-1 pr-2">
        <Poster size="lg">{title ?? DEFAULTS.error.title}</Poster>
        {typeof text === 'string' ? <Text tone="soft">{text}</Text> : text}
      </View>
      {action}
    </View>
  );
};
