import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'

import {
  type AdminExercise,
  type ExerciseFormInput,
  exerciseFormSchema,
  type ExerciseFormValues,
} from '@/entities/admin'
import { type Equipment, EQUIPMENT_LABEL, useJoints, useMuscles } from '@/entities/catalog'
import { applyFieldErrors } from '@/shared/lib/form'
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

const EQUIPMENT = (Object.keys(EQUIPMENT_LABEL) as Equipment[]).map(value => ({ value, label: EQUIPMENT_LABEL[value] }))

type ExerciseFormProps = {
  exercise: AdminExercise | null
  formId: string
  onSave: (values: ExerciseFormValues) => Promise<unknown>
}

// Упражнение справочника: все поля business-tz, 5.2. Кнопка «Сохранить» — в подвале страницы (form={formId})
export const ExerciseForm = ({ exercise, formId, onSave }: ExerciseFormProps) => {
  const muscles = useMuscles()
  const joints = useJoints()
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ExerciseFormInput, unknown, ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: exercise?.name ?? '',
      technique: exercise?.technique ?? '',
      videoUrl: exercise?.videoUrl ?? '',
      equipment: exercise?.equipment ?? 'BARBELL',
      imagePath: exercise?.imagePath ?? null,
      primary: exercise?.primary ?? [],
      secondary: exercise?.secondary ?? [],
      jointIds: exercise?.jointIds ?? [],
    },
  })
  const [primary, secondary, name] = useWatch({ control, name: ['primary', 'secondary', 'name'] })

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
          initialUrl={exercise?.imageUrl ?? null}
          alt={name}
          onUploaded={path => setValue('imagePath', path, { shouldDirty: true })}
        />
      </ScreenSection>

      <ScreenSection title='Инвентарь'>
        <div className='no-scrollbar -mx-gutter overflow-x-auto px-gutter pb-1'>
          <Controller
            control={control}
            name='equipment'
            render={({ field }) => (
              <Segmented
                options={EQUIPMENT}
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        </div>
      </ScreenSection>

      <ScreenSection
        title='Мышцы'
        aside='нажимай: осн → всп → нет'
      >
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
        title='Суставы'
        aside='для ограничений'
      >
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

      <ScreenSection title='Описание'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='item-technique'>Техника</Label>
          <Textarea
            id='item-technique'
            placeholder={'Ключевые пункты одним абзацем.\nОшибки: первая, вторая, третья.'}
            aria-invalid={!!errors.technique}
            {...register('technique')}
          />
          <ErrorText errors={errors.technique} />
          <Text
            size='xs'
            tone='muted'
          >
            Строка «Ошибки: …» станет в карточке блоком типичных ошибок.
          </Text>
        </div>
        <TextField
          label='Ссылка на видео'
          type='url'
          inputMode='url'
          placeholder='https://'
          error={errors.videoUrl}
          {...register('videoUrl')}
        />
      </ScreenSection>
    </form>
  )
}
