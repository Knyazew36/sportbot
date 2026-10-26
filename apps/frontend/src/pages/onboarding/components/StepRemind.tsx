import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { onboardingRemindSchema, type OnboardingRemindValues } from '@sportbot/api/entities/onboarding'
import { applyFieldErrors } from '@/shared/lib/form'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Text } from '@/shared/ui/kit/Typography'

import { REMIND_HINT, REMIND_OPTIONS } from '../model/remind'

type StepRemindProps = {
  formId: string
  defaultValues: Partial<OnboardingRemindValues>
  onSubmit: (values: OnboardingRemindValues) => Promise<unknown>
}

// Шаг 2: писать ли вообще. «Да» ведёт к выбору времени, «Нет» — сразу к программе
export const StepRemind = ({ formId, defaultValues, onSubmit }: StepRemindProps) => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OnboardingRemindValues>({ resolver: zodResolver(onboardingRemindSchema), defaultValues })

  return (
    <Rise>
      <form
        id={formId}
        className='flex flex-col gap-2'
        onSubmit={handleSubmit(values => onSubmit(values).catch(error => applyFieldErrors(error, setError)))}
      >
        <Controller
          control={control}
          name='remind'
          render={({ field }) => (
            <>
              <Segmented<OnboardingRemindValues['remind'] | ''>
                options={REMIND_OPTIONS}
                // До выбора ни один сегмент не нажат
                value={field.value ?? ''}
                onValueChange={field.onChange}
                size='default'
                stretch
              />
              <Text
                size='xs'
                tone='muted'
              >
                {field.value && REMIND_HINT[field.value] }
              </Text>
            </>
          )}
        />
        <ErrorText errors={errors.remind} />
      </form>
    </Rise>
  )
}
