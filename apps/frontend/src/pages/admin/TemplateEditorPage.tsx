import { zodResolver } from '@hookform/resolvers/zod'
import { EyeIcon, EyeOffIcon, Trash2Icon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'

import {
  templateMetaSchema,
  type TemplateMetaValues,
  useAddTemplateComplex,
  useAdminTemplate,
  useDeleteTemplate,
  useProgramTagGroups,
  usePublishTemplate,
  useReorderTemplateComplexes,
  useUpdateTemplate,
} from '@sportbot/api/entities/admin'
import type { Program } from '@sportbot/api/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { applyFieldErrors } from '@/shared/lib/form'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { TextField } from '@/shared/ui/kit/TextField'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'
import { arrangeBy } from '@/widgets/program-editor/arrange'
import { type ComplexListActions, ProgramComplexList } from '@/widgets/program-editor/ProgramComplexList'

const BACK = `${ROUTES.ADMIN}?tab=templates`

// Виден ли шаблон в каталоге. Новый скрыт: недособранную программу пользователи не увидят
const PublishBlock = ({ template }: { template: Program }) => {
  const publish = usePublishTemplate()

  return (
    <div className='border-foreground/80 flex flex-col gap-3 border-[1.5px] p-4'>
      <Eyebrow
        as='p'
        tone={template.isPublished ? 'primary' : 'muted'}
      >
        {template.isPublished ? 'в каталоге' : 'скрыт'}
      </Eyebrow>
      <Text tone='soft'>
        {template.isPublished
          ? 'Шаблон видят все: каталог, онбординг, бот. Правки состава придут взявшим плашкой «Шаблон обновился».'
          : 'Шаблон видишь только ты. Собери состав и выстави теги, потом покажи его в каталоге.'}
      </Text>
      <Button
        variant={template.isPublished ? 'outline' : 'default'}
        className='w-full'
        disabled={publish.isPending}
        onClick={() => publish.mutate({ id: template.id, isPublished: !template.isPublished })}
      >
        {template.isPublished ? <EyeOffIcon /> : <EyeIcon />}
        {template.isPublished ? 'Снять с публикации' : 'Показать в каталоге'}
      </Button>
    </div>
  )
}

// Название, описание и теги — то, что пользователь видит в каталоге перед «Взять»
const MetaForm = ({ template }: { template: Program }) => {
  const update = useUpdateTemplate()
  const groups = useProgramTagGroups()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<TemplateMetaValues>({
    resolver: zodResolver(templateMetaSchema),
    values: {
      name: template.name,
      description: template.description ?? '',
      tagIds: template.tags.map(t => t.id),
    },
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
      {groups.data?.map(g =>
        g.tags.length ? (
          <div
            key={g.id}
            className='flex flex-col gap-2'
          >
            <Label>{g.name}</Label>
            <Controller
              control={control}
              name='tagIds'
              render={({ field }) => {
                // Каждая группа правит только свои теги, теги других групп остаются как были
                const own = new Set(g.tags.map(t => t.id))
                return (
                  <ToggleGroup
                    multiple
                    value={field.value.filter(id => own.has(id)).map(String)}
                    onValueChange={v => field.onChange([...field.value.filter(id => !own.has(id)), ...v.map(Number)])}
                    className='grid w-full grid-cols-2 gap-2'
                  >
                    {g.tags.map(t => (
                      <ToggleGroupItem
                        key={t.id}
                        value={String(t.id)}
                        className='h-11 justify-start px-3'
                      >
                        {t.name}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )
              }}
            />
          </div>
        ) : null,
      )}
      {isDirty && (
        <Button
          type='submit'
          className='w-full'
          disabled={update.isPending}
        >
          Сохранить
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
              ? `шаблон · ${pluralize(template.data.complexes.length, ['тренировка', 'тренировки', 'тренировок'])}`
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
            <Rise className='px-gutter flex flex-col gap-6'>
              <PublishBlock template={t} />
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
                description='Удалить можно только шаблон, который ещё никто не взял. Взятый — сними с публикации.'
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
