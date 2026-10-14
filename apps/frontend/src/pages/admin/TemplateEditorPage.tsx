import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'

import {
  type TemplateMetaValues,
  templateMetaSchema,
  useAddTemplateComplex,
  useAdminTemplate,
  useDeleteTemplate,
  useReorderTemplateComplexes,
  useUpdateTemplate,
} from '@/entities/admin'
import type { Program } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { applyFieldErrors } from '@/shared/lib/form'
import { pluralize } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { TextField } from '@/shared/ui/kit/TextField'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { arrangeBy } from '@/widgets/program-editor/arrange'
import { type ComplexListActions, ProgramComplexList } from '@/widgets/program-editor/ProgramComplexList'

const BACK = `${ROUTES.ADMIN}?tab=templates`

// Название и описание — то, что пользователь видит в «Шаблоны» перед «Взять»
const MetaForm = ({ template }: { template: Program }) => {
  const update = useUpdateTemplate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<TemplateMetaValues>({
    resolver: zodResolver(templateMetaSchema),
    values: { name: template.name, description: template.description ?? '' },
  })

  return (
    <form
      className='flex flex-col gap-4'
      onSubmit={handleSubmit(values =>
        update.mutateAsync({ id: template.id, ...values }).catch(error => applyFieldErrors(error, setError)),
      )}
    >
      <TextField
        label='Название шаблона'
        error={errors.name}
        {...register('name')}
      />
      <div className='flex flex-col gap-2'>
        <Label htmlFor='template-description'>Описание</Label>
        <Textarea
          id='template-description'
          placeholder='Кому подходит и как устроена неделя'
          aria-invalid={!!errors.description}
          {...register('description')}
        />
        <ErrorText errors={errors.description} />
      </div>
      {isDirty && (
        <Button
          type='submit'
          className='w-full'
          disabled={update.isPending}
        >
          Сохранить название и описание
        </Button>
      )}
    </form>
  )
}

// Пока перестановка сохраняется, показываем новый порядок, а не старый
const useTemplateActions = (templateId: number) => {
  const addComplex = useAddTemplateComplex()
  const reorderComplexes = useReorderTemplateComplexes()

  const actions: ComplexListActions = {
    addComplex: name => addComplex.mutateAsync({ templateId, name }),
    reorderComplexes: ids => reorderComplexes.mutate({ templateId, ids }),
  }

  const arrange = (template: Program) =>
    arrangeBy(template.complexes, reorderComplexes.isPending ? reorderComplexes.variables.ids : undefined)

  return { actions, arrange, adding: addComplex.isPending }
}

// Редактор шаблона: тот же, что у программ пользователя, плюс описание (frontend-tz, 14.2)
const TemplateEditorPage = () => {
  const templateId = Number(useParams().templateId)
  const navigate = useNavigate()
  const template = useAdminTemplate(templateId)
  const remove = useDeleteTemplate()
  const { actions, arrange, adding } = useTemplateActions(templateId)

  return (
    <Screen
      header={
        <TopBar
          back={BACK}
          title={template.data?.name ?? 'Шаблон'}
          subtitle={
            template.data
              ? `шаблон · ${pluralize(template.data.complexes.length, ['комплекс', 'комплекса', 'комплексов'])}`
              : 'шаблон'
          }
          action={
            <ButtonLink
              to={BACK}
              size='sm'
            >
              Готово
            </ButtonLink>
          }
        />
      }
    >
      <QueryScreen query={template}>
        {t => (
          <>
            <Rise className='px-gutter'>
              <MetaForm template={t} />
            </Rise>

            <ProgramComplexList
              complexes={arrange(t)}
              actions={actions}
              adding={adding}
              complexTo={complexId => buildPath(ROUTES.ADMIN_TEMPLATE_COMPLEX, { templateId: t.id, complexId })}
            />

            <Rise className='px-gutter'>
              <ConfirmAction
                trigger={
                  <Button
                    variant='destructive'
                    className='w-full'
                  />
                }
                title='Удалить шаблон?'
                description='Он пропадёт из «Взять». Копии, которые пользователи уже взяли, останутся у них.'
                confirmLabel='Удалить'
                onConfirm={() => remove.mutateAsync(t.id).then(() => navigate(BACK, { replace: true }))}
              >
                <Trash2Icon />
                Удалить шаблон
              </ConfirmAction>
            </Rise>
          </>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default TemplateEditorPage
