import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { onboardingDaysSchema, type OnboardingDaysValues } from '@/entities/onboarding'
import { applyFieldErrors } from '@/shared/lib/form'
import { WEEKDAYS } from '@/shared/lib/weekdays'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'

type StepDaysProps = {
  formId: string
  defaultValues: OnboardingDaysValues
  onSubmit: (values: OnboardingDaysValues) => Promise<unknown>
}

// Шаг 1: в какие дни бот утром предложит тренировку
export const StepDays = ({ formId, defaultValues, onSubmit }: StepDaysProps) => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OnboardingDaysValues>({ resolver: zodResolver(onboardingDaysSchema), defaultValues })
  const count = useWatch({ control, name: 'trainingDays' }).length

  return (
    <Rise>
      <form
        id={formId}
        className='flex flex-col gap-3'
        onSubmit={handleSubmit(values => onSubmit(values).catch(error => applyFieldErrors(error, setError)))}
      >
        <Controller
          control={control}
          name='trainingDays'
          render={({ field }) => (
            <ToggleGroup
              multiple
              value={field.value.map(String)}
              onValueChange={next => field.onChange(next.map(Number))}
              className='grid w-full grid-cols-7'
              aria-label='Тренировочные дни'
            >
              {WEEKDAYS.map(d => (
                <ToggleGroupItem
                  key={d.value}
                  value={String(d.value)}
                  className='h-12 px-0'
                >
                  {d.short}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        />
        {errors.trainingDays ? (
          <ErrorText errors={errors.trainingDays} />
        ) : (
          <Eyebrow as='p'>{count === 0 ? 'выбери хотя бы один день' : `${count} в неделю`}</Eyebrow>
        )}
      </form>
    </Rise>
  )
}
