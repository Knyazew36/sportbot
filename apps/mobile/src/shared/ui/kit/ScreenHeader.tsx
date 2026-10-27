import type { ReactNode } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { Button } from './Button';
import { Icon } from './Icon';
import { Eyebrow, Poster } from './Typography';

type ScreenHeaderProps = {
  title: ReactNode;
  aside?: ReactNode;
  /** Действие справа вместо подписи */
  action?: ReactNode;
};

// Шапка раздела: слева раздел синим, справа контекст или кнопка — порт shared/ui/kit/ScreenHeader.tsx
export const ScreenHeader = ({ title, aside, action }: ScreenHeaderProps) => (
  <View className="border-border px-gutter flex-row items-center justify-between gap-3 border-b-[1.5px] pt-4 pb-2">
    <Eyebrow tone="primary">{title}</Eyebrow>
    {action ?? (aside ? <Eyebrow className="flex-1 text-right">{aside}</Eyebrow> : null)}
  </View>
);

type TopBarProps = {
  /** Куда ведёт «Назад». По умолчанию — системный назад */
  back?: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Действие справа: «Завершить», «Готово», список */
  action?: ReactNode;
};

// Шапка вложенного экрана: назад, заголовок, одно действие
export const TopBar = ({ back, title, subtitle, action }: TopBarProps) => (
  <View className="px-gutter flex-row items-center gap-3 py-2">
    <Button variant="outline" size="icon" accessibilityLabel="Назад" onPress={back ?? (() => router.back())}>
      <Icon as={ChevronLeft} className="size-[22px]" />
    </Button>
    <View className="min-w-0 flex-1">
      <Poster size="sm" numberOfLines={1}>
        {title}
      </Poster>
      {/* Строка — подписью капсом; элемент (живое время тренировки) рисует себя сам: View внутри Text в RN не работает */}
      {typeof subtitle === 'string' ? (
        <Eyebrow className="mt-0.5" numberOfLines={1}>
          {subtitle}
        </Eyebrow>
      ) : subtitle ? (
        <View className="mt-0.5">{subtitle}</View>
      ) : null}
    </View>
    {action ?? <View className="w-10" />}
  </View>
);
