import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { type AdminStretch, type StretchFormInput, stretchFormSchema, type StretchFormValues } from '@/entities/admin'
import { useMuscles } from '@/entities/catalog'
import { applyFieldErrors } from '@/shared/lib/form'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Rise } from '@/shared/ui/kit/Reveal'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { SettingRow } from '@/shared/ui/kit/SettingRow'
import { TextField } from '@/shared/ui/kit/TextField'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'

import { ImageField } from './ImageField'

type StretchFormProps = {
  stretch: AdminStretch | null
  formId: string
  onSave: (values: StretchFormValues) => Promise<unknown>
}

// Растяжка справочника: все поля business-tz, 5.3. Кнопка «Сохранить» — в подвале страницы (form={formId})
export const StretchForm = ({ stretch, formId, onSave }: StretchFormProps) => {
  const muscles = useMuscles()
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<StretchFormInput, unknown, StretchFormValues>({
    resolver: zodResolver(stretchFormSchema),
    defaultValues: {
      name: stretch?.name ?? '',
      howTo: stretch?.howTo ?? '',
      holdSeconds: String(stretch?.holdSeconds ?? 30),
      perSide: stretch?.perSide ?? false,
      kind: stretch?.kind ?? 'COOLDOWN',
      imagePath: stretch?.imagePath ?? null,
      muscles: stretch?.muscles ?? [],
    },
  })
  const name = useWatch({ control, name: 'name' })

  return (
    <form
      id={formId}
      className='contents'
      onSubmit={handleSubmit(values => onSave(values).catch(error => applyFieldErrors(error, setError)))}
    >
      <Rise className='px-gutter'>
        <TextField
          label='Название'
          error={errors.name}
          {...register('name')}
        />
      </Rise>

      <ScreenSection title='Картинка'>
        <ImageField
          initialUrl={stretch?.imageUrl ?? null}
          alt={name}
          onUploaded={path => setValue('imagePath', path, { shouldDirty: true })}
        />
      </ScreenSection>

      <ScreenSection title='Мышцы'>
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
          error={errors.holdSeconds}
          {...register('holdSeconds')}
        />
        <SettingRow
          title='На каждую сторону'
          hint='Время удваивается'
          htmlFor='item-per-side'
          className='border-t-[1.5px]'
        >
          <Controller
            control={control}
            name='perSide'
            render={({ field }) => (
              <Switch
                id='item-per-side'
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </SettingRow>
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
      </ScreenSection>

      <ScreenSection title='Описание'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='item-howto'>Как делать</Label>
          <Textarea
            id='item-howto'
            aria-invalid={!!errors.howTo}
            {...register('howTo')}
          />
          <ErrorText errors={errors.howTo} />
        </div>
      </ScreenSection>
    </form>
  )
}
