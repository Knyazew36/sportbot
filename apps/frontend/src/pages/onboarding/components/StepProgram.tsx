import { zodResolver } from '@hookform/resolvers/zod'
import { EyeIcon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import { useState } from 'react'

import { onboardingProgramSchema, type OnboardingProgramValues, type OnboardingState } from '@/entities/onboarding'
import { filterByTag, templateTags } from '@/entities/program'
import { pluralize } from '@/shared/lib/format'
import { CHIP_ALL, ChipFilter } from '@/shared/ui/kit/ChipFilter'
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
  // Чип — фильтр витрины, а не ответ формы: в отправку не идёт
  const [tag, setTag] = useState<string>(CHIP_ALL)
  const visible = filterByTag(templates, tag === CHIP_ALL ? null : tag)

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
              <ChipFilter
                options={templateTags(templates).map(t => ({ value: t.code, label: t.name }))}
                value={tag}
                onValueChange={next => {
                  setTag(next)
                  // Выбранный шаблон скрылся под фильтром — «Далее» возьмёт первый видимый
                  const shown = filterByTag(templates, next === CHIP_ALL ? null : next)
                  if (field.value !== 'scratch' && shown[0] && !shown.some(t => t.id === field.value))
                    field.onChange(shown[0].id)
                }}
                className='mb-1'
              />
              {visible.map(t => (
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
                    // Кнопка по умолчанию не сжимается — без этого вытолкнет «посмотреть» за край экрана
                    className='min-w-0 flex-1 shrink'
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
