import { Trash2Icon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import {
  type AdminCatalogKind,
  useAdminExercise,
  useAdminStretch,
  useDeleteCatalogItem,
  useSaveExercise,
  useSaveStretch,
} from '@/entities/admin'
import { ROUTES } from '@/shared/config/paths'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { ExerciseForm } from './components/ExerciseForm'
import { StretchForm } from './components/StretchForm'

const BACK = `${ROUTES.ADMIN}?tab=catalog`
const FORM_ID = 'catalog-item'

// Создание и правка записи справочника (frontend-tz, 14.1). itemId «new» — новая запись
const CatalogItemPage = () => {
  const params = useParams()
  const kind: AdminCatalogKind = params.kind === 'stretch' ? 'stretch' : 'exercise'
  const id = params.itemId === 'new' ? null : Number(params.itemId)
  const navigate = useNavigate()
  const exercise = useAdminExercise(kind === 'exercise' ? id : null)
  const stretch = useAdminStretch(kind === 'stretch' ? id : null)
  const saveExercise = useSaveExercise()
  const saveStretch = useSaveStretch()
  const remove = useDeleteCatalogItem()
  const noun = kind === 'exercise' ? 'упражнение' : 'растяжка'
  const saving = saveExercise.isPending || saveStretch.isPending
  const done = () => navigate(BACK, { replace: true })

  const form =
    kind === 'exercise' ? (
      <QueryScreen
        query={id == null ? { ...exercise, data: null, isPending: false } : exercise}
      >
        {data => (
          <ExerciseForm
            exercise={data}
            formId={FORM_ID}
            onSave={values => saveExercise.mutateAsync({ id, ...values }).then(done)}
          />
        )}
      </QueryScreen>
    ) : (
      <QueryScreen query={id == null ? { ...stretch, data: null, isPending: false } : stretch}>
        {data => (
          <StretchForm
            stretch={data}
            formId={FORM_ID}
            onSave={values => saveStretch.mutateAsync({ id, ...values }).then(done)}
          />
        )}
      </QueryScreen>
    )

  return (
    <Screen
      header={
        <TopBar
          back={BACK}
          title={id == null ? 'Новая запись' : (exercise.data?.name ?? stretch.data?.name ?? 'Запись')}
          subtitle={noun}
        />
      }
      footer={
        <StickyFooter>
          <Button
            type='submit'
            form={FORM_ID}
            size='lg'
            className='w-full'
            disabled={saving}
          >
            Сохранить
          </Button>
        </StickyFooter>
      }
      className='gap-8'
    >
      {form}
      {id != null && (
        <Rise className='px-gutter'>
          <ConfirmAction
            trigger={
              <Button
                variant='destructive'
                className='w-full'
              />
            }
            title='Удалить запись?'
            description='Если запись стоит в чьих-то программах или тренировках, бэк откажет — тогда лучше поправить её.'
            confirmLabel='Удалить'
            onConfirm={() => remove.mutateAsync({ kind, id }).then(done)}
          >
            <Trash2Icon />
            Удалить запись
          </ConfirmAction>
        </Rise>
      )}
    </Screen>
  )
}

export default CatalogItemPage
