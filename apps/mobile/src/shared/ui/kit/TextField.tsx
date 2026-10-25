import { View } from 'react-native';

import { ErrorText } from './ErrorText';
import { Input } from './Input';
import { Text } from './Typography';

type TextFieldProps = React.ComponentProps<typeof Input> & {
  label: string;
  description?: string;
  /** Ошибка поля из react-hook-form: formState.errors.<name> */
  error?: { message?: string };
};

// Поле формы целиком: подпись, инпут, подсказка, ошибка — порт shared/ui/kit/TextField.tsx.
// Подключается через Controller (react-hook-form): в RN нет ref-стиля register
export const TextField = ({ label, description, error, ...props }: TextFieldProps) => (
  <View className="gap-1.5">
    <Text size="sm" tone="soft">
      {label}
    </Text>
    <Input invalid={!!error} accessibilityLabel={label} {...props} />
    {description && !error ? (
      <Text size="xs" tone="muted">
        {description}
      </Text>
    ) : null}
    <ErrorText errors={error} />
  </View>
);
