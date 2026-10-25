import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { toast } from 'sonner-native';

import { getApiErrorMessage } from '@/shared/api';
import { ROUTES } from '@/shared/config/routes';
import { AuthLink, LayoutAuth } from '@/shared/layouts/layout-auth/LayoutAuth';
import { Button } from '@/shared/ui/kit/Button';
import { CodeField } from '@/shared/ui/kit/CodeField';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { TextField } from '@/shared/ui/kit/TextField';

import {
  CODE_LENGTH,
  useResendVerification,
  useVerifyEmail,
  verifyEmailSchema,
  type VerifyEmailValues,
} from '@sportbot/api/entities/session';

// Подтверждение почты — порт pages/verify-email. Единственный момент выдачи токена новому аккаунту:
// после успеха гвард (auth) сам уводит на «Сегодня»
const VerifyEmailPage = () => {
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();
  const verify = useVerifyEmail();
  const resend = useResendVerification();

  const {
    control,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<VerifyEmailValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email: paramEmail ?? '', code: '' },
  });

  const onSubmit = handleSubmit((values) => verify.mutate(values));

  const onResend = async () => {
    if (!(await trigger('email'))) return;
    resend.mutate(getValues('email'), {
      onSuccess: ({ message }) => toast.success(message),
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <LayoutAuth
      title="Подтверждение почты"
      lead="последний шаг —"
      description="Мы отправили письмо с 6-значным кодом. Введите его, чтобы войти."
      footer={
        <Button variant="link" size="sm" onPress={() => router.push(ROUTES.LOGIN)}>
          Вернуться ко входу
        </Button>
      }
    >
      <View className="gap-4">
        {/* Email известен после регистрации или входа; при прямом заходе на экран его нужно ввести */}
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
        {verify.isError && <ErrorText>{getApiErrorMessage(verify.error)}</ErrorText>}
        <Button loading={verify.isPending} onPress={onSubmit}>
          Подтвердить
        </Button>
        <Button variant="ghost" loading={resend.isPending} onPress={() => void onResend()}>
          Отправить код ещё раз
        </Button>
      </View>
    </LayoutAuth>
  );
};

export default VerifyEmailPage;
