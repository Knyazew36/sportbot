import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { Eyebrow, Poster, Text } from './Typography';

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  /** Метка над заголовком: «Тренировка A» */
  kicker?: ReactNode;
  /** Подпись под заголовком */
  description?: ReactNode;
  /** Низ шторки с главным действием — над линейкой */
  footer?: ReactNode;
  /** Шторка с загрузкой данных сразу открывается на всю высоту — без скачка, когда данные подъедут */
  fullHeight?: boolean;
  children?: ReactNode;
};

// Нижняя шторка — порт shared/ui/shadcn/sheet (side=bottom) на @gorhom/bottom-sheet.
// Высота по содержимому, потолок — 88% экрана, как во фронте. Кнопки закрытия нет: шторка смахивается вниз и закрывается тапом по подложке.
// Подложку и ручку шторка рисует сама и className не принимает — им цвета темы стилем.
// Низ с действием закреплён у края шторки: длинное содержимое прокручивается под ним, кнопку не надо искать скроллом
export const Sheet = ({ open, onOpenChange, title, kicker, description, footer, fullHeight, children }: SheetProps) => {
  const ref = useRef<BottomSheetModal>(null);
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Закреплённый низ лежит поверх прокрутки — столько же отступа снизу у содержимого, чтобы последняя строка не пряталась
  const [footerHeight, setFooterHeight] = useState(0);

  // Закрываем только реально показанную шторку. dismiss() у непоказанной модалки gorhom переводит её в DISMISSING,
  // и следующий present() молча не рисует портал — шторка открывалась раз через раз
  const presented = useRef(false);

  useEffect(() => {
    if (open) {
      presented.current = true;
      ref.current?.present();
    } else if (presented.current) {
      presented.current = false;
      ref.current?.dismiss();
    }
  }, [open]);

  // Сообщаем о закрытии, только если закрыл человек (смахнул, тап по подложке). Закрытие через open=false
  // начал сам родитель: эффект выше уже сбросил presented. Иначе onClose родителя срабатывает после его же
  // «Сохранить» — на тренировке так закрытие шторки подхода возобновляло подход вместо отдыха
  const handleDismiss = useCallback(() => {
    if (!presented.current) return;
    presented.current = false;
    onOpenChange(false);
  }, [onOpenChange]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} pressBehavior="close" />
    ),
    [],
  );

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props}>
        <View
          className="border-border px-gutter gap-3 border-t-[1.5px] pt-3"
          style={{ paddingBottom: insets.bottom + 20, backgroundColor: colors.paper }}
          onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
        >
          {footer}
        </View>
      </BottomSheetFooter>
    ),
    [footer, insets.bottom, colors.paper],
  );

  return (
    <BottomSheetModal
      ref={ref}
      // На всю высоту — фиксированная точка вместо высоты по содержимому, потолок тот же
      enableDynamicSizing={!fullHeight}
      snapPoints={fullHeight ? [height * 0.88] : undefined}
      maxDynamicContentSize={height * 0.88}
      enablePanDownToClose
      // Клавиатура убрана — шторка возвращается к своей высоте, а не остаётся задранной
      keyboardBlurBehavior="restore"
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      footerComponent={footer ? renderFooter : undefined}
      backgroundStyle={{ backgroundColor: colors.paper, borderRadius: 0, borderTopWidth: 2, borderColor: colors.ink }}
      handleIndicatorStyle={{ backgroundColor: colors.smoke, width: 48, height: 6 }}
    >
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: fullHeight ? 1 : undefined,
          paddingBottom: footer ? footerHeight + 16 : insets.bottom + 24,
        }}
      >
        <View className="px-gutter gap-1.5 pt-3 pb-3">
          {kicker ? <Eyebrow>{kicker}</Eyebrow> : null}
          {title ? <Poster size="lg">{title}</Poster> : null}
          {typeof description === 'string' ? (
            <Text size="sm" tone="muted">
              {description}
            </Text>
          ) : (
            description
          )}
        </View>
        <View className={cn('px-gutter', fullHeight && 'flex-1')}>{children}</View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};
