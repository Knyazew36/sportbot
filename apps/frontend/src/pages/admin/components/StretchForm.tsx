import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'

import { type AdminStretch, useUploadCatalogImage } from '@sportbot/api/entities/admin'
import { type StretchFormInput, stretchFormSchema, type StretchFormValues, toTextList } from '@sportbot/api/entities/catalog'
import { applyFieldErrors } from '@/shared/lib/form'
import { StretchFields } from '@/widgets/catalog/StretchFields'

type StretchFormProps = {
  stretch: AdminStretch | null
  formId: string
  onSave: (values: StretchFormValues) => Promise<unknown>
}

// Растяжка справочника: все поля business-tz, 5.3. Кнопка «Сохранить» — в подвале страницы (form={formId})
export const StretchForm = ({ stretch, formId, onSave }: StretchFormProps) => {
  const upload = useUploadCatalogImage()
  const form = useForm<StretchFormInput, unknown, StretchFormValues>({
    resolver: zodResolver(stretchFormSchema),
    defaultValues: {
      name: stretch?.name ?? '',
      howTo: stretch?.howTo ?? '',
      steps: toTextList(stretch?.steps),
      mistakes: toTextList(stretch?.mistakes),
      imageEndPath: stretch?.imageEndPath ?? null,
      holdSeconds: String(stretch?.holdSeconds ?? 30),
      perSide: stretch?.perSide ?? false,
      kind: stretch?.kind ?? 'COOLDOWN',
      imagePath: stretch?.imagePath ?? null,
      muscles: stretch?.muscles ?? [],
    },
  })

  return (
    <FormProvider {...form}>
      <form
        id={formId}
        className='contents'
        onSubmit={form.handleSubmit(values => onSave(values).catch(error => applyFieldErrors(error, form.setError)))}
      >
        <StretchFields
          initialImageUrl={stretch?.imageUrl ?? null}
          upload={upload}
          showKind
          endImage={{ initialUrl: stretch?.imageEndUrl ?? null }}
        />
      </form>
    </FormProvider>
  )
}
