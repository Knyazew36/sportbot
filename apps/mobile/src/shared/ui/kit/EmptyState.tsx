import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/shared/lib/utils';

import { ButtonBlockContext } from './button-block';
import { Eyebrow, Poster, Text } from './Typography';

type EmptyStateProps = {
  /** Надпись над заголовком: «пусто», «пусто · поиск» */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Кнопки одного размера: встают столбиком во всю ширину, главная — первой */
  action?: ReactNode;
  className?: string;
};

// Единый вид пустоты — порт shared/ui/kit/EmptyState.tsx: плакатом слева, без рамки и иконки.
// Кнопки разной ширины рядом «ехали», поэтому внутри все они во всю ширину (ButtonBlockContext)
export const EmptyState = ({ eyebrow = 'пусто', title, description, action, className }: EmptyStateProps) => (
  <View className={cn('items-start gap-5 py-4', className)}>
    <View className="gap-2">
      <Eyebrow>{eyebrow}</Eyebrow>
      <Poster size="xl">{title}</Poster>
      {typeof description === 'string' ? <Text tone="soft">{description}</Text> : description}
    </View>
    {action ? (
      <ButtonBlockContext.Provider value>
        <View className="gap-2 self-stretch">{action}</View>
      </ButtonBlockContext.Provider>
    ) : null}
  </View>
);
