import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_NAME } from '@/shared/config/app';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';

type LayoutAuthProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Ссылки под формой: «Нет аккаунта?», «Забыли пароль?» */
  footer?: ReactNode;
};

// Общая рамка страниц входа — порт shared/layouts/layout-auth/LayoutAuth.tsx.
// Клавиатура не закрывает поля: контент уезжает вверх (iOS), Android сам сдвигает окно
export const LayoutAuth = ({ title, description, children, footer }: LayoutAuthProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View className="bg-canvas flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="grow justify-center gap-6 p-4" keyboardShouldPersistTaps="handled">
          <Eyebrow tone="primary" className="text-center">
            {APP_NAME}
          </Eyebrow>
          <View className="border-border bg-card gap-5 border-[1.5px] p-5">
            <View className="gap-1">
              <Poster size="lg">{title}</Poster>
              {description ? (
                <Text size="sm" tone="muted">
                  {description}
                </Text>
              ) : null}
            </View>
            {children}
          </View>
          {footer ? <View className="items-center gap-2">{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// Текст рядом со ссылкой под формой; сама навигация — снаружи, через router
export const AuthLink = ({ children }: { children: ReactNode }) => (
  <Text size="sm" medium>
    {children}
  </Text>
);
