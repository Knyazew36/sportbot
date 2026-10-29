import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { CloudOff } from 'lucide-react-native';

import { cn } from '@/shared/lib/utils';

import { EmptyState } from './EmptyState';
import { Icon } from './Icon';
import { Poster, Text } from './Typography';

type StateViewProps = {
  state: 'loading' | 'error' | 'empty' | 'denied';
  /** Ошибка: заголовок, описание, действие («Повторить») */
  error?: { title: string; description?: string; action?: ReactNode };
  /** Пусто: подсказка, что делать */
  empty?: { title?: string; description?: ReactNode; action?: ReactNode };
  className?: string;
};

// Состояния экрана без данных: загрузка, ошибка с повтором, пусто, нет прав — порт StateView.
// Страница описывает только успешный случай
export const StateView = ({ state, error, empty, className }: StateViewProps) => {
  if (state === 'loading') {
    return (
      <View className={cn('items-center py-12', className)}>
        <ActivityIndicator size="large" colorClassName="accent-primary" />
      </View>
    );
  }

  const frame = cn('items-center gap-3 px-6 py-12', className);

  if (state === 'denied') {
    return (
      <View className={frame}>
        <Poster size="md">Нет доступа</Poster>
        <Text tone="muted" className="text-center">
          Этот раздел доступен не всем
        </Text>
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View accessibilityRole="alert" className={frame}>
        <View className="bg-background border-destructive size-12 items-center justify-center border-[1.5px]">
          <Icon as={CloudOff} className="text-destructive size-6" />
        </View>
        <Poster size="md">{error?.title ?? 'Не удалось загрузить'}</Poster>
        {error?.description ? (
          <Text tone="muted" className="text-center">
            {error.description}
          </Text>
        ) : null}
        {error?.action}
      </View>
    );
  }

  return (
    <EmptyState
      title={empty?.title ?? 'Пока пусто'}
      description={empty?.description}
      action={empty?.action}
      className={className}
    />
  );
};
