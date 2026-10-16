import { zodResolver } from '@hookform/resolvers/zod'
import { EyeIcon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import { useEffect, useState } from 'react'

import { onboardingProgramSchema, type OnboardingProgramValues, type OnboardingState } from '@/entities/onboarding'
import { selectedTagIds, type TagSelection, useTemplates, useTemplateTagGroups } from '@/entities/program'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value'
import { OptionButton } from '@/shared/ui/kit/OptionButton'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { TemplateFilter } from '@/widgets/template-filter/TemplateFilter'

import { TemplatePreviewSheet } from './TemplatePreviewSheet'

type StepProgramProps = {
  formId: string
  templates: OnboardingState['templates']
  onSubmit: (values: OnboardingProgramValues) => Promise<unknown>
}

// Шаг 3: готовый шаблон или своя программа с нуля. По умолчанию — первый шаблон, как «Далее» в боте.
// Подбор тот же, что в каталоге: группы тегов и поиск
export const StepProgram = ({ formId, templates, onSubmit }: StepProgramProps) => {
  const { control, handleSubmit, getValues, setValue } = useForm<OnboardingProgramValues>({
    resolver: zodResolver(onboardingProgramSchema),
    defaultValues: { choice: templates[0]?.id ?? 'scratch' },
  })

  // Какой шаблон открыт в шторке «посмотреть»
  const [preview, setPreview] = useState<number | null>(null)
  // Фильтр — подбор витрины, а не ответ формы: в отправку не идёт и в ссылку не пишется
  const [selection, setSelection] = useState<TagSelection>({})
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim())
  const groups = useTemplateTagGroups()
  const catalog = useTemplates({ tagIds: selectedTagIds(groups.data ?? [], selection), search })
  const visible = catalog.data ?? []

  // Выбранный шаблон скрылся под фильтром — «Далее» возьмёт первый видимый
  useEffect(() => {
    const list = catalog.data ?? []
    const choice = getValues('choice')
    const [first] = list
    if (choice !== 'scratch' && first && !list.some(t => t.id === choice)) setValue('choice', first.id)
  }, [catalog.data, getValues, setValue])

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
              {templates.length > 0 && (
                <TemplateFilter
                  groups={groups.data ?? []}
                  selection={selection}
                  onSelectionChange={setSelection}
                  search={query}
                  onSearchChange={setQuery}
                />
              )}
              {catalog.isSuccess && !visible.length && templates.length > 0 && (
                <Text
                  tone='soft'
                  className='py-2'
                >
                  Под такой фильтр ничего нет — сбрось его или собери свою с нуля.
                </Text>
              )}
              {visible.map(t => (
                <div
                  key={t.id}
                  className='flex gap-2'
                >
                  <OptionButton
                    type='button'
                    title={t.name}
                    meta={`${pluralize(t.complexes.length, ['комплекс', 'комплекса', 'комплексов'])} в очереди`}
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
