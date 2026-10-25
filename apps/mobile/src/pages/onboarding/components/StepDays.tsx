import { forwardRef, useImperativeHandle } from 'react';
import { Pressable, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { onboardingDaysSchema, type OnboardingDaysValues } from '@sportbot/api/entities/onboarding';
import { applyFieldErrors } from '@/shared/lib/form';
import { haptic } from '@/shared/lib/haptics';
import { WEEKDAYS } from '@/shared/lib/weekdays';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Eyebrow } from '@/shared/ui/kit/Typography';
import { cn } from '@/shared/lib/utils';

import type { StepHandle } from '../model/steps';

type StepDaysProps = {
  defaultValues: OnboardingDaysValues;
  onSubmit: (values: OnboardingDaysValues) => Promise<unknown>;
};

// Шаг 1: в какие дни бот утром предложит тренировку
export const StepDays = forwardRef<StepHandle, StepDaysProps>(({ defaultValues, onSubmit }, ref) => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OnboardingDaysValues>({ resolver: zodResolver(onboardingDaysSchema), defaultValues });
  const count = useWatch({ control, name: 'trainingDays' }).length;

  useImperativeHandle(ref, () => ({
    submit: handleSubmit((values) => onSubmit(values).catch((e) => applyFieldErrors(e, setError))),
  }));

  return (
    <View className="gap-3">
      <Controller
        control={control}
        name="trainingDays"
        render={({ field }) => (
          <View className="flex-row flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const selected = field.value.includes(day.value);
              return (
                <Pressable
                  key={day.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    haptic.tap();
                    field.onChange(
                      selected
                        ? field.value.filter((value) => value !== day.value)
                        : [...field.value, day.value].sort(),
                    );
                  }}
                  className={cn(
                    'border-foreground size-11 items-center justify-center border-[1.5px]',
                    selected ? 'bg-foreground' : 'bg-background active:bg-mist',
                  )}
                >
                  <Eyebrow className={cn('font-display', selected ? 'text-background' : 'text-foreground')}>
                    {day.short}
                  </Eyebrow>
                </Pressable>
              );
            })}
          </View>
        )}
      />
      {errors.trainingDays ? (
        <ErrorText errors={errors.trainingDays} />
      ) : (
        <Eyebrow>{count === 0 ? 'выбери хотя бы один день' : `${count} в неделю`}</Eyebrow>
      )}
    </View>
  );
});

StepDays.displayName = 'StepDays';
