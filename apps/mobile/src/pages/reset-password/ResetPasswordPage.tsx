import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { toast } from '@/shared/ui/kit/toast';

import { getApiErrorMessage } from '@/shared/api';
import { ROUTES } from '@/shared/config/routes';
import { AuthLink, LayoutAuth } from '@/shared/layouts/layout-auth/LayoutAuth';
import { Button } from '@/shared/ui/kit/Button';
import { CodeField } from '@/shared/ui/kit/CodeField';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { TextField } from '@/shared/ui/kit/TextField';

import {
  CODE_LENGTH,
  resetPasswordSchema,
  useResetPassword,
  type ResetPasswordValues,
} from '@sportbot/api/entities/session';

// Сброс пароля, шаг 2 — порт pages/reset-password. Сброс токен не выдаёт — входим заново с новым паролем
const ResetPasswordPage = () => {
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();
  const reset = useResetPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: paramEmail ?? '', code: '', newPassword: '' },
  });

  const onSubmit = handleSubmit((values) =>
    reset.mutate(values, {
      onSuccess: ({ message }) => {
        toast.success(message);
        router.push({ pathname: ROUTES.LOGIN, params: { email: values.email } });
      },
    }),
  );

  return (
    <LayoutAuth
      title="Новый пароль"
      lead="почти готово —"
      description="Введите код из письма и придумайте новый пароль."
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
              editable={!paramEmail}
              autoComplete="email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
          )}
        />
        <Controller
          control={control}
          name="code"
          render={() => <CodeField control={control} name="code" length={CODE_LENGTH} error={errors.code} />}
        />
        <Controller
          control={control}
          name="newPassword"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Новый пароль"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoComplete="new-password"
              description="Не короче 8 символов"
              error={errors.newPassword}
            />
          )}
        />
        {reset.isError && <ErrorText>{getApiErrorMessage(reset.error)}</ErrorText>}
        <Button loading={reset.isPending} onPress={onSubmit}>
          Сменить пароль
        </Button>
      </View>
    </LayoutAuth>
  );
};

export default ResetPasswordPage;
