import { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { onboardingGenderSchema, type OnboardingGenderValues } from '@sportbot/api/entities/onboarding';
import { GENDERS, type Gender } from '@sportbot/api/entities/profile';
import { applyFieldErrors } from '@/shared/lib/form';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { Eyebrow } from '@/shared/ui/kit/Typography';

import type { StepHandle } from '../model/steps';

export type { StepHandle };

type StepGenderProps = {
  defaultValues: Partial<OnboardingGenderValues>;
  onSubmit: (values: OnboardingGenderValues) => Promise<unknown>;
};

// Шаг 0: пол — сразу задаёт расцветку приложения
export const StepGender = forwardRef<StepHandle, StepGenderProps>(({ defaultValues, onSubmit }, ref) => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OnboardingGenderValues>({ resolver: zodResolver(onboardingGenderSchema), defaultValues });

  useImperativeHandle(ref, () => ({ submit: handleSubmit((values) => onSubmit(values).catch((e) => applyFieldErrors(e, setError))) }));

  return (
    <View className="gap-3">
      <Controller
        control={control}
        name="gender"
        render={({ field }) => (
          <Segmented
            options={GENDERS}
            // До выбора ни один сегмент не нажат
            value={(field.value as Gender | undefined) ?? ('' as Gender)}
            onValueChange={field.onChange}
            stretch
          />
        )}
      />
      {errors.gender ? (
        <ErrorText errors={errors.gender} />
      ) : (
        <Eyebrow>синяя или розовая расцветка</Eyebrow>
      )}
    </View>
  );
});

StepGender.displayName = 'StepGender';
