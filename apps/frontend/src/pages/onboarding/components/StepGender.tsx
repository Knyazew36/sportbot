import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { onboardingGenderSchema, type OnboardingGenderValues } from '@/entities/onboarding'
import { GENDERS } from '@/entities/profile'
import { applyFieldErrors } from '@/shared/lib/form'
import type { Gender } from '@/shared/lib/hooks/use-palette'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Eyebrow } from '@/shared/ui/kit/Typography'

type StepGenderProps = {
  formId: string
  defaultValues: Partial<OnboardingGenderValues>
  onSubmit: (values: OnboardingGenderValues) => Promise<unknown>
}

// Шаг 0: пол — сразу задаёт расцветку приложения
export const StepGender = ({ formId, defaultValues, onSubmit }: StepGenderProps) => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OnboardingGenderValues>({ resolver: zodResolver(onboardingGenderSchema), defaultValues })

  return (
    <Rise>
      <form
        id={formId}
        className='flex flex-col gap-3'
        onSubmit={handleSubmit(values => onSubmit(values).catch(error => applyFieldErrors(error, setError)))}
      >
        <Controller
          control={control}
          name='gender'
          render={({ field }) => (
            <Segmented
              options={GENDERS}
              // До выбора ни один сегмент не нажат
              value={field.value as Gender}
              onValueChange={field.onChange}
              size='default'
              stretch
            />
          )}
        />
        {errors.gender ? <ErrorText errors={errors.gender} /> : <Eyebrow as='p'>синяя или розовая расцветка</Eyebrow>}
      </form>
    </Rise>
  )
}
