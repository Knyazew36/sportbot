import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import {
  deleteAccountSchema,
  useDeleteAccount,
  type DeleteAccountInput,
  type DeleteAccountValues,
} from '@sportbot/api/entities/session';

import { applyFieldErrors } from '@/shared/lib/form';
import { Button } from '@/shared/ui/kit/Button';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { TextField } from '@/shared/ui/kit/TextField';
import { Text } from '@/shared/ui/kit/Typography';

type DeleteAccountSectionProps = {
  /** Пароль задан (вход по email) — без него сервер не удалит */
  hasPassword: boolean;
};

// Удаление аккаунта — обязательно для App Store (MOBILE_TZ.md, этап 1). Порт DeleteAccount из pages/profile.
// Слово «удалить» сервер требует как защиту от случайного вызова — его даёт диалог подтверждения
export const DeleteAccountSection = ({ hasPassword }: DeleteAccountSectionProps) => {
  const remove = useDeleteAccount();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DeleteAccountInput, unknown, DeleteAccountValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { currentPassword: '' },
  });

  // Неверный пароль (422) — под полем; диалог при ошибке остаётся открытым
  const confirm = handleSubmit(({ currentPassword }) =>
    remove.mutateAsync({ confirmation: 'удалить', currentPassword }).catch((error: unknown) => {
      applyFieldErrors(error, setError);
      throw error;
    }),
  );

  return (
    <View className="px-gutter gap-3">
      <Text size="sm" tone="muted">
        Аккаунт удаляется безвозвратно вместе с историей тренировок.
      </Text>
      {hasPassword && (
        <Controller
          control={control}
          name="currentPassword"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Текущий пароль"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoComplete="current-password"
              error={errors.currentPassword}
            />
          )}
        />
      )}
      <ConfirmAction
        trigger={<Button variant="destructive" />}
        title="Удалить аккаунт?"
        description="Это действие нельзя отменить."
        confirmLabel="Удалить навсегда"
        onConfirm={() => confirm()}
      >
        Удалить аккаунт
      </ConfirmAction>
    </View>
  );
};
