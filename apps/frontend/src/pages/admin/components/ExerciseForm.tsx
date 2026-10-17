import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'

import { type AdminExercise, useUploadCatalogImage } from '@/entities/admin'
import { type ExerciseFormInput, exerciseFormSchema, type ExerciseFormValues, toTextList } from '@/entities/catalog'
import { applyFieldErrors } from '@/shared/lib/form'
import { ExerciseFields } from '@/widgets/catalog/ExerciseFields'

type ExerciseFormProps = {
  exercise: AdminExercise | null
  formId: string
  onSave: (values: ExerciseFormValues) => Promise<unknown>
}

// Упражнение справочника: все поля business-tz, 5.2. Кнопка «Сохранить» — в подвале страницы (form={formId})
export const ExerciseForm = ({ exercise, formId, onSave }: ExerciseFormProps) => {
  const upload = useUploadCatalogImage()
  const form = useForm<ExerciseFormInput, unknown, ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: exercise?.name ?? '',
      technique: exercise?.technique ?? '',
      steps: toTextList(exercise?.steps),
      mistakes: toTextList(exercise?.mistakes),
      imageEndPath: exercise?.imageEndPath ?? null,
      videoUrl: exercise?.videoUrl ?? '',
      equipment: exercise?.equipment ?? 'BARBELL',
      imagePath: exercise?.imagePath ?? null,
      primary: exercise?.primary ?? [],
      secondary: exercise?.secondary ?? [],
      jointIds: exercise?.jointIds ?? [],
    },
  })

  return (
    <FormProvider {...form}>
      <form
        id={formId}
        className='contents'
        onSubmit={form.handleSubmit(values => onSave(values).catch(error => applyFieldErrors(error, form.setError)))}
      >
        <ExerciseFields
          initialImageUrl={exercise?.imageUrl ?? null}
          upload={upload}
          endImage={{ initialUrl: exercise?.imageEndUrl ?? null }}
        />
      </form>
    </FormProvider>
  )
}
