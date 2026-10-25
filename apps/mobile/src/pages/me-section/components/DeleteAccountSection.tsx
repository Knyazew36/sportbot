import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import {
  deleteAccountSchema,
  useDeleteAccount,
  useMe,
  type DeleteAccountInput,
  type DeleteAccountValues,
} from '@sportbot/api/entities/session';

import { applyFieldErrors } from '@/shared/lib/form';
import { Button } from '@/shared/ui/kit/Button';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { TextField } from '@/shared/ui/kit/TextField';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';

import { ERASED, KEPT } from '../model/delete-account';

// Удаление аккаунта — обязательно для App Store (MOBILE_TZ.md, этап 1). Порт DeleteAccount из pages/profile.
// Слово «удалить» сервер требует как защиту от случайного вызова — его даёт диалог подтверждения
export const DeleteAccountSection = () => {
  const remove = useDeleteAccount();
  // Пароль задан у входа по email — без него сервер не удалит
  const hasPassword = !!useMe().data?.email;

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
      <View className="border-destructive/60 gap-4 border-[1.5px] border-dashed p-4">
        <View className="gap-1">
          <Eyebrow tone="danger" className="mb-0.5">
            Сотрётся
          </Eyebrow>
          {ERASED.map((item) => (
            <Text key={item} size="xs" tone="soft">
              {`• ${item}`}
            </Text>
          ))}
        </View>
        <View className="gap-1">
          <Eyebrow className="mb-0.5">Останется</Eyebrow>
          {KEPT.map((item) => (
            <Text key={item} size="xs" tone="soft">
              {`• ${item}`}
            </Text>
          ))}
        </View>
      </View>
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
        title="Удалить все данные?"
        description="Это не отменить. После удаления приложение начнётся с первого запуска."
        confirmLabel="Удалить навсегда"
        onConfirm={() => confirm()}
      >
        Удалить аккаунт
      </ConfirmAction>
    </View>
  );
};
