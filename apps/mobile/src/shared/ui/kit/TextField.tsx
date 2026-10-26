import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ErrorText } from './ErrorText';
import { Input } from './Input';
import { Text } from './Typography';

type TextFieldProps = React.ComponentProps<typeof Input> & {
  label: string;
  description?: string;
  /** Действие справа от подписи: «Забыли пароль?» у поля пароля */
  labelAction?: ReactNode;
  /** Ошибка поля из react-hook-form: formState.errors.<name> */
  error?: { message?: string };
};

// Поле формы целиком: подпись, инпут, подсказка, ошибка — порт shared/ui/kit/TextField.tsx.
// Подключается через Controller (react-hook-form): в RN нет ref-стиля register
export const TextField = ({ label, description, labelAction, error, ...props }: TextFieldProps) => (
  <View className="gap-1.5">
    <View className="min-h-5 flex-row items-center justify-between">
      <Text size="sm" tone="soft">
        {label}
      </Text>
      {labelAction}
    </View>
    <Input invalid={!!error} accessibilityLabel={label} {...props} />
    {description && !error ? (
      <Text size="xs" tone="muted">
        {description}
      </Text>
    ) : null}
    <ErrorText errors={error} />
  </View>
);
