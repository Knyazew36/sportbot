import type { ReactNode } from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

import { APP_NAME } from '@/shared/config/app';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Lead, Poster, Text } from '@/shared/ui/kit/Typography';

// contentContainerClassName доходит до contentContainerStyle только через withUniwind
const AwareScroll = withUniwind(KeyboardAwareScrollView);

type LayoutAuthProps = {
  title: string;
  /** Вводная строка антиквой над заголовком: «с возвращением —» */
  lead?: string;
  description?: ReactNode;
  children: ReactNode;
  /** Ссылки под формой: «Нет аккаунта?» */
  footer?: ReactNode;
};

// Общая рамка страниц входа — чистый лист без декора: марка сверху, заголовок и форма прижаты к низу,
// под большой палец. Свободное место уходит в зазор под маркой, поэтому на любом экране всё влезает без скролла.
// Клавиатура не закрывает поля: скролл сам докручивает поле в фокусе над ней — и на iOS, и на Android
export const LayoutAuth = ({ title, lead, description, children, footer }: LayoutAuthProps) => {
  const insets = useSafeAreaInsets();
  const [head, ...tail] = title.split(' ');

  return (
    <View className="bg-canvas flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <AwareScroll
        // Над клавиатурой видно не только поле, но и его подпись ошибки
        bottomOffset={32}
        contentContainerClassName="px-gutter grow pt-5 pb-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // Влезло в экран — не тянется: отскок пустого листа выглядел как лишний скролл
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        <Rise className="flex-row items-center gap-2">
          <View className="bg-primary size-2.5" />
          <Eyebrow tone="default">{APP_NAME}</Eyebrow>
        </Rise>

        <View className="min-h-8 grow" />

        <Rise index={1}>
          {lead ? <Lead size="md" tone="muted">{lead}</Lead> : null}
          <Poster size="4xl" tone="primary" fit className="mt-1">
            {head}
          </Poster>
          {tail.length > 0 && (
            <Poster size="xl" fit>
              {tail.join(' ')}
            </Poster>
          )}
          {description ? (
            <Text tone="soft" className="mt-3 max-w-[320px]">
              {description}
            </Text>
          ) : null}
        </Rise>

        <Rise index={2} className="mt-7">
          {children}
        </Rise>

        {footer ? (
          <Rise index={3} className="mt-6 items-center">
            {footer}
          </Rise>
        ) : null}
      </AwareScroll>
    </View>
  );
};

// Текст рядом со ссылкой под формой; сама навигация — снаружи, через router
export const AuthLink = ({ children }: { children: ReactNode }) => (
  <Text size="sm" tone="muted">
    {children}
  </Text>
);

// Разделитель «или через бота»: правило — капс — правило
export const AuthDivider = ({ children }: { children: string }) => (
  <View className="flex-row items-center gap-3">
    <View className="bg-foreground/15 h-px flex-1" />
    <Eyebrow size="sm">{children}</Eyebrow>
    <View className="bg-foreground/15 h-px flex-1" />
  </View>
);
