import { Controller, useFormContext, useWatch } from 'react-hook-form'

import type { ComponentProps, ReactNode } from 'react'

import { type StretchFormInput, useMuscles } from '@/entities/catalog'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Rise } from '@/shared/ui/kit/Reveal'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { SettingRow } from '@/shared/ui/kit/SettingRow'
import { TextField } from '@/shared/ui/kit/TextField'
import { Text } from '@/shared/ui/kit/Typography'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'

import { ImageField } from './ImageField'
import { TextListField } from './TextListField'

type StretchFieldsProps = {
  initialImageUrl: string | null
  upload: ComponentProps<typeof ImageField>['upload']
  /** Тип «заминка / разминка» — только у админа: пользователю он ничего не меняет */
  showKind?: boolean
  /** Под названием: при создании — «Возможно, ты искал…». Получает введённое название */
  afterName?: (name: string) => ReactNode
  /** Фото финишного положения — только у админа: initialUrl текущего фото */
  endImage?: { initialUrl: string | null }
}

// Поля растяжки (business-tz, 5.3) — общие для создания, правки от пользователя и формы админа.
// Форма и её схема — снаружи, поля берут её из FormProvider
export const StretchFields = ({ initialImageUrl, upload, showKind, afterName, endImage }: StretchFieldsProps) => {
  const muscles = useMuscles()
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<StretchFormInput>()
  const name = useWatch({ control, name: 'name' })

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

      <ScreenSection
        title='Какие мышцы тянет'
        aside='хотя бы одна'
      >
        <Text
          size='sm'
          tone='muted'
        >
          По ним бот подбирает растяжку в заминку после тренировки.
        </Text>
        <Controller
          control={control}
          name='muscles'
          render={({ field }) => (
            <ToggleGroup
              multiple
              value={field.value.map(String)}
              onValueChange={v => field.onChange(v.map(Number))}
              className='grid w-full grid-cols-2 gap-2'
            >
              {(muscles.data ?? []).map(m => (
                <ToggleGroupItem
                  key={m.id}
                  value={String(m.id)}
                  className='h-11 justify-start px-3'
                >
                  {m.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        />
        <ErrorText errors={errors.muscles} />
      </ScreenSection>

      <ScreenSection title='Удержание'>
        <TextField
          label='Время, секунд'
          inputMode='numeric'
          description='От 5 до 300 секунд.'
          error={errors.holdSeconds}
          {...register('holdSeconds')}
        />
        <SettingRow
          title='На каждую сторону'
          hint='Время удваивается'
          htmlFor='stretch-per-side'
          className='border-t-[1.5px]'
        >
          <Controller
            control={control}
            name='perSide'
            render={({ field }) => (
              <Switch
                id='stretch-per-side'
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </SettingRow>
        {showKind && (
          <div className='flex flex-col gap-2'>
            <Label>Тип движения</Label>
            <Controller
              control={control}
              name='kind'
              render={({ field }) => (
                <Segmented
                  options={[
                    { value: 'COOLDOWN', label: 'Заминка' },
                    { value: 'WARMUP', label: 'Разминка' },
                  ]}
                  value={field.value}
                  onValueChange={field.onChange}
                  stretch
                />
              )}
            />
          </div>
        )}
      </ScreenSection>

      <ScreenSection title='Как делать'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='stretch-howto'>Описание</Label>
          <Textarea
            id='stretch-howto'
            placeholder='Исходное положение и что должно тянуть'
            aria-invalid={!!errors.howTo}
            {...register('howTo')}
          />
          <ErrorText errors={errors.howTo} />
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
      </ScreenSection>
    </>
  )
}
