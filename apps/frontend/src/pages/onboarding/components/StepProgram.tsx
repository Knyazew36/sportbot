import { zodResolver } from '@hookform/resolvers/zod'
import { EyeIcon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import { useState } from 'react'

import { onboardingProgramSchema, type OnboardingProgramValues, type OnboardingState } from '@/entities/onboarding'
import { pluralize } from '@/shared/lib/format'
import { OptionButton } from '@/shared/ui/kit/OptionButton'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { TemplatePreviewSheet } from './TemplatePreviewSheet'

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

  // Какой шаблон открыт в шторке «посмотреть»
  const [preview, setPreview] = useState<number | null>(null)

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
              {templates.map(t => (
                <div
                  key={t.id}
                  className='flex gap-2'
                >
                  <OptionButton
                    type='button'
                    title={t.name}
                    meta={`${pluralize(t.complexCount, ['комплекс', 'комплекса', 'комплексов'])} в очереди`}
                    selected={field.value === t.id}
                    onClick={() => field.onChange(t.id)}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='icon-lg'
                    className='h-auto self-stretch'
                    onClick={() => setPreview(t.id)}
                    aria-label={`Что внутри «${t.name}»`}
                  >
                    <EyeIcon className='size-5' />
                  </Button>
                </div>
              ))}

              {/* «С нуля» — другой путь, а не ещё один шаблон: отделяем от списка */}
              <Eyebrow className='mt-4 mb-1'>или</Eyebrow>
              <OptionButton
                type='button'
                title='С нуля'
                meta='соберу программу сам'
                selected={field.value === 'scratch'}
                onClick={() => field.onChange('scratch')}
                className='border-dashed'
              />

              <TemplatePreviewSheet
                templateId={preview}
                onOpenChange={open => !open && setPreview(null)}
                onPick={id => {
                  field.onChange(id)
                  setPreview(null)
                }}
              />
            </div>
          )}
        />
      </form>
    </Rise>
  )
}
