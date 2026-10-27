import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  children?: ReactNode;
};

// Нижняя шторка — порт shared/ui/shadcn/sheet (side=bottom) на @gorhom/bottom-sheet.
// Высота по содержимому, потолок — 88% экрана, как во фронте. Кнопки закрытия нет: шторка смахивается вниз и закрывается тапом по подложке.
// Подложку и ручку шторка рисует сама и className не принимает — им цвета темы стилем.
// Низ с действием прокручивается вместе с содержимым: при динамической высоте шторка обычно не упирается в потолок
export const Sheet = ({ open, onOpenChange, title, kicker, description, footer, children }: SheetProps) => {
  const ref = useRef<BottomSheetModal>(null);
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

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

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.88}
      enablePanDownToClose
      // Клавиатура убрана — шторка возвращается к своей высоте, а не остаётся задранной
      keyboardBlurBehavior="restore"
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.paper, borderRadius: 0, borderTopWidth: 2, borderColor: colors.ink }}
      handleIndicatorStyle={{ backgroundColor: colors.smoke, width: 48, height: 6 }}
    >
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: footer ? 0 : insets.bottom + 24 }}
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
        <View className="px-gutter">{children}</View>
        {footer ? (
          <View
            className="border-border px-gutter mt-4 gap-3 border-t-[1.5px] pt-3"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            {footer}
          </View>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};
