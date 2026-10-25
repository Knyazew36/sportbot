import { View } from 'react-native';
import { CircleAlert } from 'lucide-react-native';

import { Icon } from './Icon';
import { Text } from './Typography';

type ErrorLike = { message?: string } | string | null | undefined;

type ErrorTextProps = {
  // Либо готовый текст в children, либо ошибки из react-hook-form / API — дубли схлопываются
  children?: string;
  errors?: ErrorLike | ErrorLike[];
};

const toMessages = (errors: ErrorTextProps['errors']) => {
  const list = Array.isArray(errors) ? errors : [errors];
  const messages = list
    .map((error) => (typeof error === 'string' ? error : error?.message))
    .filter(Boolean) as string[];
  return [...new Set(messages)];
};

// Единственный компонент текста ошибки: поле формы, форма целиком, ошибка действия.
// Иконка обязательна — ошибка не передаётся одним красным цветом
export const ErrorText = ({ children, errors }: ErrorTextProps) => {
  const messages = children ? [children] : toMessages(errors);
  if (messages.length === 0) return null;

  return (
    <View className="flex-row items-start gap-1.5">
      <Icon as={CircleAlert} className="text-destructive mt-0.5 size-[15px]" />
      <View className="flex-1 gap-0.5">
        {messages.map((message) => (
          <Text key={message} size="sm" tone="danger">
            {message}
          </Text>
        ))}
      </View>
    </View>
  );
};
