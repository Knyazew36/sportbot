import { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { onboardingRemindSchema, type OnboardingRemindValues } from '@sportbot/api/entities/onboarding';
import { applyFieldErrors } from '@/shared/lib/form';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { Text } from '@/shared/ui/kit/Typography';

import { REMIND_HINT, REMIND_OPTIONS } from '../model/remind';
import type { StepHandle } from '../model/steps';

type StepRemindProps = {
  defaultValues: Partial<OnboardingRemindValues>;
  onSubmit: (values: OnboardingRemindValues) => Promise<unknown>;
};

// Шаг 2: писать ли вообще. «Да» ведёт к выбору времени, «Нет» — сразу к программе
export const StepRemind = forwardRef<StepHandle, StepRemindProps>(({ defaultValues, onSubmit }, ref) => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OnboardingRemindValues>({ resolver: zodResolver(onboardingRemindSchema), defaultValues });

  useImperativeHandle(ref, () => ({
    submit: handleSubmit((values) => onSubmit(values).catch((e) => applyFieldErrors(e, setError))),
  }));

  return (
    <View className="gap-2">
      <Controller
        control={control}
        name="remind"
        render={({ field }) => (
          <>
            <Segmented
              options={REMIND_OPTIONS}
              // До выбора ни один сегмент не нажат
              value={field.value ?? ('' as OnboardingRemindValues['remind'])}
              onValueChange={field.onChange}
              stretch
            />
            <Text size="xs" tone="muted">
              {field.value && REMIND_HINT[field.value]}
            </Text>
          </>
        )}
      />
      <ErrorText errors={errors.remind} />
    </View>
  );
});

StepRemind.displayName = 'StepRemind';
