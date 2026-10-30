import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

import { useScreenFocused } from '@/shared/lib/hooks/use-screen-focused';
import { cn } from '@/shared/lib/utils';

import { Glass } from './Glass';
import { type BlurTarget, useScreenChrome } from './screen-chrome';

// Поле в фокусе само докручивается над клавиатурой. className доходят до стилей только через withUniwind
const AwareScroll = withUniwind(KeyboardAwareScrollView);

type ScreenProps = {
  header?: ReactNode;
  /** Липкий низ: обычно StickyFooter с главным действием */
  footer?: ReactNode;
  /** Заливка стекла под футером, если на этом экране размытие должно быть заметнее общего */
  footerTone?: string;
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
// Шапка, низ и нижнее меню лежат поверх прокрутки матовым стеклом, как sticky во фронте: контент уходит под них
// и просвечивает размытым. Поэтому отступы контента — высоты этих полос, а их видно только после разметки.
// Отступы от выреза и жестовой полосы — через safe-area-context: их размер известен только в рантайме
export const Screen = ({
  header,
  footer,
  footerTone,
  children,
  scroll = true,
  fullscreen,
  onRefresh,
  refreshing = false,
  className,
}: ScreenProps) => {
  const insets = useSafeAreaInsets();
  const { navHeight, registerNavTarget } = useScreenChrome();
  const focused = useScreenFocused();
  const target: BlurTarget = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);

  // Меню одно на все разделы, а размывать ему нужно тот, что сейчас на виду
  useEffect(() => {
    if (!focused || !registerNavTarget) return;
    return registerNavTarget(target);
  }, [focused, registerNavTarget]);

  // Низ без футера и без меню упирается в жестовую полосу — отступаем от неё
  const bottom = fullscreen && !footer ? insets.bottom : 0;
  const top = header ? headerHeight : insets.top;
  const end = bottom + (footer ? footerHeight : 0) + navHeight;
  const content = cn('gap-8 pt-6 pb-8', className);

  return (
    <View className="bg-background flex-1">
      <BlurTargetView ref={target} style={styles.fill}>
        {scroll ? (
          <AwareScroll
            className="flex-1"
            bottomOffset={32 + (footer ? footerHeight : 0)}
            contentContainerStyle={{ paddingTop: top, paddingBottom: end }}
            scrollIndicatorInsets={{ top, bottom: end }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  progressViewOffset={top}
                  tintColorClassName="accent-primary"
                  colorsClassName="accent-primary"
                />
              ) : undefined
            }
          >
            <View className={content}>{children}</View>
          </AwareScroll>
        ) : (
          <View className="flex-1" style={{ paddingTop: top, paddingBottom: end }}>
            <View className={cn('flex-1', content)}>{children}</View>
          </View>
        )}
      </BlurTargetView>
      {header ? (
        <Glass
          target={target}
          tone="bg-background/90"
          className="absolute inset-x-0 top-0"
          style={{ paddingTop: insets.top }}
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
        >
          {header}
        </Glass>
      ) : null}
      {footer ? (
        <Glass
          target={target}
          tone={footerTone}
          className="absolute inset-x-0"
          style={{ bottom: navHeight, paddingBottom: fullscreen ? insets.bottom : 0 }}
          onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
        >
          {footer}
        </Glass>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({ fill: { flex: 1 } });

type StickyFooterProps = { children?: ReactNode; className?: string };

// Главное действие у большого пальца: прилипает к низу экрана или над нижним меню, фон — стекло Screen.
// Кнопки — размера lg, прижаты вправо
export const StickyFooter = ({ children, className }: StickyFooterProps) => (
  <View
    className={cn(
      'border-border px-gutter flex-row flex-wrap items-center justify-end gap-2 border-t-[1.5px] pt-3 pb-4',
      className,
    )}
  >
    {children}
  </View>
);
