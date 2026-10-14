import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { onboardingProgramSchema, type OnboardingProgramValues, type OnboardingState } from '@/entities/onboarding'
import { pluralize } from '@/shared/lib/format'
import { OptionButton } from '@/shared/ui/kit/OptionButton'
import { Rise } from '@/shared/ui/kit/Reveal'

type StepProgramProps = {
  formId: string
  templates: OnboardingState['templates']
  onSubmit: (values: OnboardingProgramValues) => Promise<unknown>
}

// Шаг 3: готовый шаблон или своя программа с нуля. По умолчанию — первый шаблон, как «Далее» в боте
export const StepProgram = ({ formId, templates, onSubmit }: StepProgramProps) => {
  const { control, handleSubmit } = useForm<OnboardingProgramValues>({
    resolver: zodResolver(onboardingProgramSchema),
    defaultValues: { choice: templates[0]?.id ?? 'scratch' },
  })

  const options = [
    ...templates.map(t => ({
      value: t.id as OnboardingProgramValues['choice'],
      title: t.name,
      meta: `${pluralize(t.complexCount, ['комплекс', 'комплекса', 'комплексов'])} в очереди`,
    })),
    { value: 'scratch' as const, title: 'С нуля', meta: 'соберу программу сам' },
  ]

  return (
    <Rise>
      <form
        id={formId}
        onSubmit={handleSubmit(values => onSubmit(values).catch(() => undefined))}
      >
        <Controller
          control={control}
          name='choice'
          render={({ field }) => (
            <div
              role='radiogroup'
              aria-label='Программа'
              className='flex flex-col gap-2'
            >
              {options.map(option => (
                <OptionButton
                  key={option.value}
                  type='button'
                  title={option.title}
                  meta={option.meta}
                  selected={field.value === option.value}
                  onClick={() => field.onChange(option.value)}
                />
              ))}
            </div>
          )}
        />
      </form>
    </Rise>
  )
}
