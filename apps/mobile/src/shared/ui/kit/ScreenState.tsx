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
import { CloudOff, Inbox, type LucideIcon } from 'lucide-react-native';

import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { Icon } from './Icon';
import { Hatch } from './Patterns';
import { Poster, Text } from './Typography';

type ScreenStateProps = {
  state: 'loading' | 'empty' | 'error';
  title?: string;
  description?: ReactNode;
  /** «Повторить» для ошибки, подсказка-действие для пустого списка */
  action?: ReactNode;
  icon?: LucideIcon;
  /** Сколько строк-скелетов показать при загрузке */
  rows?: number;
  className?: string;
};

const DEFAULTS = {
  empty: { icon: Inbox, title: 'Пока пусто', description: 'Здесь появятся записи.' },
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
  const { colors } = useTheme();

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

  const error = state === 'error';
  const StateIcon = icon ?? DEFAULTS[state].icon;

  return (
    <View
      accessibilityRole={error ? 'alert' : undefined}
      className={cn(
        'items-start gap-3 overflow-hidden border-[1.5px] p-5',
        error ? 'border-destructive/60 border-dashed' : 'border-border',
        className,
      )}
    >
      {!error && <Hatch color={colors.hatch} />}
      <View
        className={cn(
          'bg-background size-12 items-center justify-center border-[1.5px]',
          error ? 'border-destructive' : 'border-foreground/70',
        )}
      >
        <Icon as={StateIcon} className={cn('size-6', error && 'text-destructive')} />
      </View>
      <View className="bg-background gap-1 pr-2">
        <Poster size="lg">{title ?? DEFAULTS[state].title}</Poster>
        {typeof (description ?? DEFAULTS[state].description) === 'string' ? (
          <Text tone="soft">{description ?? DEFAULTS[state].description}</Text>
        ) : (
          description
        )}
      </View>
      {action}
    </View>
  );
};
