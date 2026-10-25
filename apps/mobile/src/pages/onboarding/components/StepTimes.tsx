import { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { onboardingTimesSchema, type OnboardingTimesValues } from '@sportbot/api/entities/onboarding';
import { applyFieldErrors } from '@/shared/lib/form';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { TextField } from '@/shared/ui/kit/TextField';
import { Text } from '@/shared/ui/kit/Typography';

import type { StepHandle } from '../model/steps';

type StepTimesProps = {
  /** Режим вопросов не предзаполняем: на него отвечают явно */
  defaultValues: Omit<OnboardingTimesValues, 'askMode'>;
  onSubmit: (values: OnboardingTimesValues) => Promise<unknown>;
};

const ASK_MODES = [
  { value: 'remind', label: 'Напоминать' },
  { value: 'once', label: 'Один раз' },
  { value: 'off', label: 'Не писать' },
] as const;

const ASK_MODE_HINT: Record<OnboardingTimesValues['askMode'], string> = {
  remind: 'Не ответишь — утренний вопрос повторю через 2 часа, вечерний на следующее утро.',
  once: 'Каждый вопрос приходит один раз, без повторов.',
  off: 'Бот сам не пишет. Тренировки отмечаешь в приложении, день без отметки — пропуск.',
};

// Шаг 2: когда бот утром спросит про тренировку и вечером — как прошло, и повторять ли без ответа
export const StepTimes = forwardRef<StepHandle, StepTimesProps>(({ defaultValues, onSubmit }, ref) => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OnboardingTimesValues>({ resolver: zodResolver(onboardingTimesSchema), defaultValues });

  useImperativeHandle(ref, () => ({
    submit: handleSubmit((values) => onSubmit(values).catch((e) => applyFieldErrors(e, setError))),
  }));

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="morningTime"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label="Утренний вопрос"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="08:00"
                error={errors.morningTime}
              />
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="eveningTime"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label="Вечерний вопрос"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="21:00"
                error={errors.eveningTime}
              />
            )}
          />
        </View>
      </View>
      <Text size="xs" tone="muted">
        Время московское. Часовой пояс меняется в профиле.
      </Text>
      <View className="gap-2 mt-2">
        <Text size="sm" tone="soft">
          Как спрашивать?
        </Text>
        <Controller
          control={control}
          name="askMode"
          render={({ field }) => (
            <>
              <Segmented
                options={ASK_MODES}
                value={field.value ?? ('' as OnboardingTimesValues['askMode'])}
                onValueChange={field.onChange}
                stretch
              />
              <Text size="xs" tone="muted">
                {field.value ? ASK_MODE_HINT[field.value] : 'Поменять можно в профиле.'}
              </Text>
            </>
          )}
        />
        <ErrorText errors={errors.askMode} />
      </View>
    </View>
  );
});

StepTimes.displayName = 'StepTimes';
