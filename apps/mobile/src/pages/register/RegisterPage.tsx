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

import { registerSchema, useRegister, type RegisterValues } from '@sportbot/api/entities/session';

// Регистрация — порт pages/register. Токен выдаётся только после подтверждения почты — дальше ввод кода
const RegisterPage = () => {
  const registration = useRegister();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(({ name, lastName, ...credentials }) =>
    registration.mutate(
      // Пустые необязательные поля не отправляем: сервер ждёт либо строку, либо отсутствие ключа
      { ...credentials, ...(name && { name }), ...(lastName && { lastName }) },
      {
        onSuccess: ({ email }) => {
          router.push({ pathname: ROUTES.VERIFY_EMAIL, params: { email } });
        },
      },
    ),
  );

  return (
    <LayoutAuth
      title="Регистрация"
      lead="первый подход —"
      footer={
        <View className="flex-row gap-1">
          <AuthLink>Уже есть аккаунт?</AuthLink>
          <Button variant="link" size="sm" onPress={() => router.push(ROUTES.LOGIN)}>
            Войти
          </Button>
        </View>
      }
    >
      <View className="gap-4">
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Имя"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              autoComplete="given-name"
              error={errors.name}
            />
          )}
        />
        <Controller
          control={control}
          name="lastName"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Фамилия"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              autoComplete="family-name"
              error={errors.lastName}
            />
          )}
        />
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
        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Пароль"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoComplete="new-password"
              description="Не короче 8 символов"
              error={errors.password}
            />
          )}
        />
        {registration.isError && <ErrorText>{getApiErrorMessage(registration.error)}</ErrorText>}
        <Button loading={registration.isPending} onPress={onSubmit}>
          Создать аккаунт
        </Button>
      </View>
    </LayoutAuth>
  );
};

export default RegisterPage;
