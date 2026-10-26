import type { ReactNode } from 'react';
import { RefreshControl, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

import { cn } from '@/shared/lib/utils';

// Поле в фокусе само докручивается над клавиатурой. className доходят до стилей только через withUniwind
const AwareScroll = withUniwind(KeyboardAwareScrollView);

type ScreenProps = {
  header?: ReactNode;
  /** Липкий низ: обычно StickyFooter с главным действием */
  footer?: ReactNode;
  children: ReactNode;
  /**
   * Прокрутка экрана целиком (по умолчанию). false — экран сам решает скролл: длинные списки
   * (FlatList) не должны жить в общем ScrollView
   */
  scroll?: boolean;
  /** Экран без нижнего меню (тренировка, онбординг): низ отступает от жестовой полосы сам */
  fullscreen?: boolean;
  /** Потянуть вниз — обновить данные экрана */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Раскладка контента: отступы, gap */
  className?: string;
};

// Каркас экрана — порт shared/ui/kit/Screen.tsx: шапка под вырезом, контент, липкий низ.
// Отступы от выреза и жестовой полосы — через safe-area-context: их размер известен только в рантайме
export const Screen = ({
  header,
  footer,
  children,
  scroll = true,
  fullscreen,
  onRefresh,
  refreshing = false,
  className,
}: ScreenProps) => {
  const insets = useSafeAreaInsets();
  // Низ без футера и без меню упирается в жестовую полосу — отступаем от неё
  const bottom = fullscreen && !footer ? insets.bottom : 0;
  const content = cn('gap-8 pt-6 pb-8', className);

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top }}>
      {header}
      {scroll ? (
        <AwareScroll
          className="flex-1"
          bottomOffset={32}
          contentContainerClassName={content}
          contentContainerStyle={{ paddingBottom: 32 + bottom }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColorClassName="accent-primary"
                colorsClassName="accent-primary"
              />
            ) : undefined
          }
        >
          {children}
        </AwareScroll>
      ) : (
        <View className={cn('flex-1', content)} style={{ paddingBottom: 32 + bottom }}>
          {children}
        </View>
      )}
      {footer ? (
        <View className="bg-background" style={{ paddingBottom: fullscreen ? insets.bottom : 0 }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
};

type StickyFooterProps = { children?: ReactNode; className?: string };

// Главное действие у большого пальца: прилипает к низу экрана. Кнопки — размера lg, прижаты вправо
export const StickyFooter = ({ children, className }: StickyFooterProps) => (
  <View
    className={cn(
      'border-border bg-background px-gutter flex-row flex-wrap items-center justify-end gap-2 border-t-[1.5px] pt-3 pb-4',
      className,
    )}
  >
    {children}
  </View>
);
