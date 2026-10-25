import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { router } from 'expo-router';

import { getApiErrorMessage } from '@/shared/api';
import { ROUTES } from '@/shared/config/routes';
import { AuthLink, LayoutAuth } from '@/shared/layouts/layout-auth/LayoutAuth';
import { Button } from '@/shared/ui/kit/Button';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { TextField } from '@/shared/ui/kit/TextField';

import { forgotPasswordSchema, useForgotPassword, type ForgotPasswordValues } from '@sportbot/api/entities/session';

// Сброс пароля, шаг 1 — порт pages/forgot-password.
// Сервер отвечает одинаково для существующего и несуществующего email — сразу ведём на ввод кода
const ForgotPasswordPage = () => {
  const forgot = useForgotPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit(({ email }) =>
    forgot.mutate(email, {
      onSuccess: () => {
        router.push({ pathname: ROUTES.RESET_PASSWORD, params: { email } });
      },
    }),
  );

  return (
    <LayoutAuth
      title="Сброс пароля"
      description="Укажите email аккаунта — пришлём код для смены пароля."
      footer={
        <Button variant="link" size="sm" onPress={() => router.push(ROUTES.LOGIN)}>
          Вернуться ко входу
        </Button>
      }
    >
      <View className="gap-4">
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoComplete="email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
          )}
        />
        {forgot.isError && <ErrorText>{getApiErrorMessage(forgot.error)}</ErrorText>}
        <Button loading={forgot.isPending} onPress={onSubmit}>
          Получить код
        </Button>
      </View>
    </LayoutAuth>
  );
};

export default ForgotPasswordPage;
