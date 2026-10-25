import { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { pluralize } from '@front-cmdt/utils/pluralize';

import {
  onboardingProgramSchema,
  type OnboardingProgramValues,
  type OnboardingState,
} from '@sportbot/api/entities/onboarding';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Eyebrow } from '@/shared/ui/kit/Typography';
import { OptionButton } from '@/shared/ui/kit/OptionButton';

import type { StepHandle } from '../model/steps';

type StepProgramProps = {
  templates: OnboardingState['templates'];
  onSubmit: (values: OnboardingProgramValues) => Promise<unknown>;
};

// Шаг 3: готовый шаблон или своя программа с нуля. По умолчанию — первый шаблон, как «Далее» в боте.
// Подбор поиском/фильтром тегов — у фронта, здесь список шаблонов с сервера (этап 2, каталог программ)
export const StepProgram = forwardRef<StepHandle, StepProgramProps>(({ templates, onSubmit }, ref) => {
  const { control, handleSubmit } = useForm<OnboardingProgramValues>({
    resolver: zodResolver(onboardingProgramSchema),
    defaultValues: { choice: templates[0]?.id ?? 'scratch' },
  });

  useImperativeHandle(ref, () => ({
    submit: handleSubmit((values) => onSubmit(values).catch(() => undefined)),
  }));

  return (
    <Controller
      control={control}
      name="choice"
      render={({ field }) => (
        <View className="gap-2">
          {templates.map((template) => (
            <OptionButton
              key={template.id}
              title={template.name}
              meta={`${pluralize(template.complexCount, ['тренировка', 'тренировки', 'тренировок'])} в очереди`}
              selected={field.value === template.id}
              onPress={() => field.onChange(template.id)}
            />
          ))}

          {/* «С нуля» — другой путь, а не ещё один шаблон: отделяем от списка */}
          <Eyebrow className="mt-3 mb-1">
            или
          </Eyebrow>
          <OptionButton
            title="С нуля"
            meta="соберу программу сам"
            selected={field.value === 'scratch'}
            onPress={() => field.onChange('scratch')}
          />
        </View>
      )}
    />
  );
});

StepProgram.displayName = 'StepProgram';
