import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { onboardingTimesSchema, type OnboardingTimesValues } from '@/entities/onboarding'
import { applyFieldErrors } from '@/shared/lib/form'
import { Rise } from '@/shared/ui/kit/Reveal'
import { TextField } from '@/shared/ui/kit/TextField'
import { Text } from '@/shared/ui/kit/Typography'

type StepTimesProps = {
  formId: string
  defaultValues: OnboardingTimesValues
  onSubmit: (values: OnboardingTimesValues) => Promise<unknown>
}

// Шаг 2: когда бот утром спросит про тренировку и вечером — как прошло
export const StepTimes = ({ formId, defaultValues, onSubmit }: StepTimesProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OnboardingTimesValues>({ resolver: zodResolver(onboardingTimesSchema), defaultValues })

  return (
    <Rise>
      <form
        id={formId}
        className='grid grid-cols-2 gap-3'
        onSubmit={handleSubmit(values => onSubmit(values).catch(error => applyFieldErrors(error, setError)))}
      >
        <TextField
          label='Утренний вопрос'
          type='time'
          error={errors.morningTime}
          {...register('morningTime')}
        />
        <TextField
          label='Вечерний вопрос'
          type='time'
          error={errors.eveningTime}
          {...register('eveningTime')}
        />
        <Text
          size='xs'
          tone='muted'
          className='col-span-2'
        >
          Время московское. Часовой пояс меняется в профиле.
        </Text>
      </form>
    </Rise>
  )
}
