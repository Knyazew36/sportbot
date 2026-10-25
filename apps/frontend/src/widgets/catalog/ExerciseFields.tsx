import { Controller, useFormContext, useWatch } from 'react-hook-form'

import type { ComponentProps, ReactNode } from 'react'

import { type Equipment, EQUIPMENT_LABEL, type ExerciseFormInput, useJoints, useMuscles } from '@sportbot/api/entities/catalog'
import { type Measure, MEASURE_LABEL } from '@sportbot/api/lib/measure'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Rise } from '@/shared/ui/kit/Reveal'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { TextField } from '@/shared/ui/kit/TextField'
import { Text } from '@/shared/ui/kit/Typography'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'

import { ImageField } from './ImageField'
import { MuscleRoles } from './MuscleRoles'
import { TextListField } from './TextListField'

const EQUIPMENT = (Object.keys(EQUIPMENT_LABEL) as Equipment[]).map(value => ({ value, label: EQUIPMENT_LABEL[value] }))
const MEASURES = (Object.keys(MEASURE_LABEL) as Measure[]).map(value => ({ value, label: MEASURE_LABEL[value] }))

type ExerciseFieldsProps = {
  initialImageUrl: string | null
  upload: ComponentProps<typeof ImageField>['upload']
  /** Под названием: при создании — «Возможно, ты искал…». Получает введённое название */
  afterName?: (name: string) => ReactNode
  /** Фото финишного положения — только у админа: initialUrl текущего фото */
  endImage?: { initialUrl: string | null }
}

// Поля упражнения (business-tz, 5.2) — общие для создания, правки от пользователя и формы админа.
// Форма и её схема — снаружи, поля берут её из FormProvider
export const ExerciseFields = ({ initialImageUrl, upload, afterName, endImage }: ExerciseFieldsProps) => {
  const muscles = useMuscles()
  const joints = useJoints()
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<ExerciseFormInput>()
  const [primary, secondary, name] = useWatch({ control, name: ['primary', 'secondary', 'name'] })

  return (
    <>
      <Rise className='px-gutter'>
        <TextField
          label='Название'
          error={errors.name}
          {...register('name')}
        />
      </Rise>
      {afterName?.(name)}

      <ScreenSection title='Картинка'>
        <ImageField
          initialUrl={initialImageUrl}
          alt={name}
          upload={upload}
          onUploaded={path => setValue('imagePath', path, { shouldDirty: true })}
        />
      </ScreenSection>

      {endImage && (
        <ScreenSection
          title='Фото финиша'
          aside='можно пропустить'
        >
          <ImageField
            initialUrl={endImage.initialUrl}
            alt={`${name}: финиш`}
            upload={upload}
            onUploaded={path => setValue('imageEndPath', path, { shouldDirty: true })}
          />
        </ScreenSection>
      )}

      <ScreenSection title='Инвентарь'>
        <div className='no-scrollbar -mx-gutter px-gutter overflow-x-auto pb-1'>
          <Controller
            control={control}
            name='equipment'
            render={({ field }) => (
              <Segmented
                options={EQUIPMENT}
                // У записи инвентаря может не быть — тогда ни один сегмент не выбран
                value={field.value ?? ''}
                onValueChange={v => field.onChange(v || null)}
              />
            )}
          />
        </div>
      </ScreenSection>

      <ScreenSection title='Чем меряется'>
        <Text
          size='sm'
          tone='muted'
        >
          Секунды — для удержаний вроде планки, минуты — для кардио: дорожка, велотренажёр, скакалка. Без веса.
        </Text>
        <Controller
          control={control}
          name='measure'
          render={({ field }) => (
            <Segmented
              options={MEASURES}
              value={field.value}
              onValueChange={v => v && field.onChange(v)}
              stretch
            />
          )}
        />
      </ScreenSection>

      <ScreenSection
        title='Мышцы'
        aside='нажимай по кругу'
      >
        <Text
          size='sm'
          tone='muted'
        >
          1 нажатие — основная (делает главную работу), 2 — помогает, 3 — не участвует.
        </Text>
        <MuscleRoles
          muscles={muscles.data ?? []}
          primary={primary}
          secondary={secondary}
          onChange={next => {
            setValue('primary', next.primary, { shouldDirty: true, shouldValidate: true })
            setValue('secondary', next.secondary, { shouldDirty: true })
          }}
        />
        <ErrorText errors={errors.primary} />
      </ScreenSection>

      <ScreenSection
        title='Суставы под нагрузкой'
        aside='можно пропустить'
      >
        <Text
          size='sm'
          tone='muted'
        >
          У кого в профиле ограничение на отмеченный сустав, тот увидит предупреждение на этом упражнении.
        </Text>
        <Controller
          control={control}
          name='jointIds'
          render={({ field }) => (
            <ToggleGroup
              multiple
              value={field.value.map(String)}
              onValueChange={v => field.onChange(v.map(Number))}
              className='grid w-full grid-cols-2 gap-2'
            >
              {(joints.data ?? []).map(j => (
                <ToggleGroupItem
                  key={j.id}
                  value={String(j.id)}
                  className='h-11 justify-start px-3'
                >
                  {j.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        />
      </ScreenSection>

      <ScreenSection title='Техника'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='item-technique'>Описание</Label>
          <Textarea
            id='item-technique'
            placeholder='Исходное положение и на что обратить внимание'
            aria-invalid={!!errors.technique}
            {...register('technique')}
          />
          <ErrorText errors={errors.technique} />
        </div>
        <TextListField
          name='steps'
          label='Шаги'
          placeholder='Одно действие'
          addLabel='Добавить шаг'
        />
        <TextListField
          name='mistakes'
          label='Ошибки'
          placeholder='Ошибка — как исправить'
          addLabel='Добавить ошибку'
        />
        <TextField
          label='Ссылка на видео'
          type='url'
          inputMode='url'
          placeholder='https://'
          error={errors.videoUrl}
          {...register('videoUrl')}
        />
      </ScreenSection>
    </>
  )
}
