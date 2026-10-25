import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Poster, Text } from '@/shared/ui/kit/Typography';

type SectionHeadingProps = { title: string; aside?: string; action?: ReactNode };

// Заголовок блока витрины: плакатом, пояснение строкой ниже — блоки разные по виду, но читаются как разделы афиши
export const SectionHeading = ({ title, aside, action }: SectionHeadingProps) => (
  <View className="px-gutter flex-row items-end justify-between gap-3">
    <View className="min-w-0 flex-1 gap-1">
      <Poster size="lg">{title}</Poster>
      {aside ? (
        <Text size="sm" tone="muted">
          {aside}
        </Text>
      ) : null}
    </View>
    {action}
  </View>
);
