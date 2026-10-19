import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { onboardingTimesSchema, type OnboardingTimesValues } from '@/entities/onboarding'
import { applyFieldErrors } from '@/shared/lib/form'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { TextField } from '@/shared/ui/kit/TextField'
import { Text } from '@/shared/ui/kit/Typography'
import { Label } from '@/shared/ui/shadcn/label'

type StepTimesProps = {
  formId: string
  /** Напоминания не предзаполняем: на них отвечают явно */
  defaultValues: Omit<OnboardingTimesValues, 'remindersEnabled'>
  onSubmit: (values: OnboardingTimesValues) => Promise<unknown>
}

const REMINDERS = [
  { value: 'yes', label: 'Напоминать' },
  { value: 'no', label: 'Не напоминать' },
] as const

// Шаг 2: когда бот утром спросит про тренировку и вечером — как прошло, и повторять ли без ответа
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
          <Label>Напоминать, если не ответишь?</Label>
          <Text
            size='xs'
            tone='muted'
          >
            Утренний вопрос повторю через 2 часа, вечерний — на следующее утро. Поменять можно в профиле.
          </Text>
          <Controller
            control={control}
            name='remindersEnabled'
            render={({ field }) => (
              <Segmented<'yes' | 'no' | ''>
                options={REMINDERS}
                value={field.value === undefined ? '' : field.value ? 'yes' : 'no'}
                onValueChange={v => field.onChange(v === 'yes')}
                size='default'
                stretch
              />
            )}
          />
          <ErrorText errors={errors.remindersEnabled} />
        </div>
      </form>
    </Rise>
  )
}
