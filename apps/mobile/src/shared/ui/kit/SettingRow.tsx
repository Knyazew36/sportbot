import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/shared/lib/utils';

import { Text } from './Typography';

type SettingRowProps = {
  title: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
};

// Строка настройки — порт shared/ui/kit/SettingRow.tsx: подпись с пояснением слева, контрол справа
export const SettingRow = ({ title, hint, children, className }: SettingRowProps) => (
  <View className={cn('border-border flex-row items-center justify-between gap-4 border-b-[1.5px] py-3.5', className)}>
    <View className="min-w-0 flex-1">
      {typeof title === 'string' ? (
        <Text size="lg" className="leading-[20px]">
          {title}
        </Text>
      ) : (
        title
      )}
      {hint ? (
        <Text size="xs" tone="muted" className="mt-1">
          {hint}
        </Text>
      ) : null}
    </View>
    <View className="shrink-0">{children}</View>
  </View>
);
