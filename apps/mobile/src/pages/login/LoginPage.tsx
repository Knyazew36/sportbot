import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { ArrowRight, MessageCircle, Send } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getApiErrorMessage, getApiErrorStatus } from '@/shared/api';
import { ROUTES } from '@/shared/config/routes';
import { AuthDivider, AuthLink, LayoutAuth } from '@/shared/layouts/layout-auth/LayoutAuth';
import { Button } from '@/shared/ui/kit/Button';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { TextField } from '@/shared/ui/kit/TextField';

import { loginSchema, useLogin, type LoginValues } from '@sportbot/api/entities/session';

// Вход по email — порт pages/login. После успеха токен сохранён — гвард (auth) сам уводит на «Сегодня»
const LoginPage = () => {
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();
  const login = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: paramEmail ?? '', password: '' },
  });

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, {
      onError: (error) => {
        // 403 — почта не подтверждена: сервер уже выслал новый код, ведём на его ввод
        if (getApiErrorStatus(error) === 403) {
          router.push({ pathname: ROUTES.VERIFY_EMAIL, params: { email: values.email } });
        }
      },
    }),
  );

  return (
    <LayoutAuth
      title="Вход"
      lead="с возвращением —"
      footer={
        <>
          <View className="flex-row items-center gap-1">
            <AuthLink>Нет аккаунта?</AuthLink>
            <Button variant="link" size="sm" onPress={() => router.push(ROUTES.REGISTER)}>
              Зарегистрироваться
            </Button>
          </View>
          <Button variant="ghost" size="sm" onPress={() => router.push(ROUTES.FORGOT_PASSWORD)}>
            Забыли пароль?
          </Button>
        </>
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
              autoComplete="current-password"
              error={errors.password}
            />
          )}
        />
        {login.isError && <ErrorText>{getApiErrorMessage(login.error)}</ErrorText>}
        <Button size="lg" spread iconRight={ArrowRight} loading={login.isPending} onPress={onSubmit} className="mt-2">
          Войти
        </Button>
        <AuthDivider>или через бота</AuthDivider>
        <View className="flex-row gap-3">
          <Button
            variant="outline"
            icon={Send}
            className="flex-1"
            onPress={() => router.push({ pathname: ROUTES.MESSENGER_LOGIN, params: { provider: 'telegram' } })}
          >
            Telegram
          </Button>
          <Button
            variant="outline"
            icon={MessageCircle}
            className="flex-1"
            onPress={() => router.push({ pathname: ROUTES.MESSENGER_LOGIN, params: { provider: 'max' } })}
          >
            MAX
          </Button>
        </View>
      </View>
    </LayoutAuth>
  );
};

export default LoginPage;
