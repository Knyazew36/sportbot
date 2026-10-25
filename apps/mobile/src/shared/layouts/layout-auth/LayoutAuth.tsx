import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_NAME } from '@/shared/config/app';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Lead, Poster, Text } from '@/shared/ui/kit/Typography';

import { PosterSun } from './components/PosterSun';

type LayoutAuthProps = {
  title: string;
  /** Вводная строка антиквой над заголовком: «с возвращением —» */
  lead?: string;
  description?: ReactNode;
  children: ReactNode;
  /** Ссылки под формой: «Нет аккаунта?», «Забыли пароль?» */
  footer?: ReactNode;
};

// Общая рамка страниц входа — плакат, как «Сегодня»: вводная антиквой, первое слово заголовка огромным синим,
// остальное строкой ниже. Форма лежит прямо на листе: карточка в карточке только дробила экран.
// Клавиатура не закрывает поля: контент уезжает вверх (iOS), Android сам сдвигает окно
export const LayoutAuth = ({ title, lead, description, children, footer }: LayoutAuthProps) => {
  const insets = useSafeAreaInsets();
  const [head, ...tail] = title.split(' ');

  return (
    <View className="bg-canvas flex-1 overflow-hidden">
      <PosterSun />
      <KeyboardAvoidingView
        className="flex-1"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="px-gutter grow pt-4 pb-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Rise className="flex-row items-center gap-2">
            <View className="bg-primary size-2.5" />
            <Eyebrow tone="default">{APP_NAME}</Eyebrow>
          </Rise>

          <Rise index={1} className="mt-auto pt-16">
            {lead ? <Lead>{lead}</Lead> : null}
            <Poster size="display" tone="primary" fit className="mt-1">
              {head}
            </Poster>
            {tail.length > 0 && (
              <Poster size="2xl" className="mt-1">
                {tail.join(' ')}
              </Poster>
            )}
            {description ? (
              <Text tone="soft" className="mt-3 max-w-[320px]">
                {description}
              </Text>
            ) : null}
          </Rise>

          <Rise index={2} className="border-foreground mt-6 border-t-[1.5px] pt-6">
            {children}
          </Rise>

          {footer ? (
            <Rise index={3} className="mt-8 items-center gap-2">
              {footer}
            </Rise>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
    <View className="bg-foreground/20 h-px flex-1" />
    <Eyebrow size="sm">{children}</Eyebrow>
    <View className="bg-foreground/20 h-px flex-1" />
  </View>
);
