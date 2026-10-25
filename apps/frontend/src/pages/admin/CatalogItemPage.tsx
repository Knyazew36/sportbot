import { EyeIcon, EyeOffIcon, Trash2Icon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import {
  type AdminCatalogKind,
  useAdminExercise,
  useAdminStretch,
  useDeleteCatalogItem,
  usePublishCatalogItem,
  useSaveExercise,
  useSaveStretch,
  useUnpublishCatalogItem,
} from '@sportbot/api/entities/admin'
import { ROUTES } from '@/shared/config/paths'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Text } from '@/shared/ui/kit/Typography'
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
  const unpublish = useUnpublishCatalogItem()
  const publish = usePublishCatalogItem()
  const item = kind === 'exercise' ? exercise.data : stretch.data
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
            disabled={saving}
          >
            Сохранить
          </Button>
        </StickyFooter>
      }
      className='gap-8'
    >
      {form}
      {id != null && item && (
        <Rise className='px-gutter flex flex-col gap-3'>
          <Text
            size='sm'
            tone='muted'
          >
            {item.status === 'CATALOG' ? 'В общем справочнике' : 'Не в справочнике — видна только автору'}
            {item.author ? ` · автор: ${item.author}` : ''}
          </Text>
          {item.status === 'CATALOG' ? (
            <ConfirmAction
              trigger={
                <Button
                  variant='outline'
                  className='w-full'
                />
              }
              title='Снять с публикации?'
              description='Запись пропадёт из справочника. У автора она останется личной, а там, где её уже поставили, останется по ссылке.'
              confirmLabel='Снять'
              onConfirm={() => unpublish.mutateAsync({ kind, id })}
            >
              <EyeOffIcon />
              Снять с публикации
            </ConfirmAction>
          ) : (
            <Button
              variant='outline'
              className='w-full'
              disabled={publish.isPending}
              onClick={() => publish.mutate({ kind, id })}
            >
              <EyeIcon />
              Вернуть в справочник
            </Button>
          )}
          <ConfirmAction
            trigger={
              <Button
                variant='destructive'
                className='w-full'
              />
            }
            title='Удалить запись?'
            description='Если запись стоит в чьих-то программах или тренировках, удалить не выйдет — тогда сними её с публикации.'
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
