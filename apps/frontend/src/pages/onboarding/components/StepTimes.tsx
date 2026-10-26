import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { onboardingTimesSchema, type OnboardingTimesValues } from '@sportbot/api/entities/onboarding'
import { applyFieldErrors } from '@/shared/lib/form'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { TextField } from '@/shared/ui/kit/TextField'
import { Text } from '@/shared/ui/kit/Typography'
import { Label } from '@/shared/ui/shadcn/label'

import { ASK_MODE_HINT, ASK_MODES } from '../model/remind'

type StepTimesProps = {
  formId: string
  /** Режим вопросов не предзаполняем: на него отвечают явно */
  defaultValues: Omit<OnboardingTimesValues, 'askMode'>
  onSubmit: (values: OnboardingTimesValues) => Promise<unknown>
}

// Шаг 2, если напоминать: когда бот утром спросит про тренировку и вечером — как прошло, и повторять ли без ответа
export const StepTimes = ({ formId, defaultValues, onSubmit }: StepTimesProps) => {
  const {
    control,
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
        <div className='col-span-2 mt-3 flex flex-col gap-2'>
          <Label>Если не ответишь?</Label>
          <Controller
            control={control}
            name='askMode'
            render={({ field }) => (
              <>
                <Segmented<OnboardingTimesValues['askMode'] | ''>
                  options={ASK_MODES}
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  size='default'
                  stretch
                />
                <Text
                  size='xs'
                  tone='muted'
                >
                  {field.value && ASK_MODE_HINT[field.value]}
                </Text>
              </>
            )}
          />
          <ErrorText errors={errors.askMode} />
        </div>
      </form>
    </Rise>
  )
}
