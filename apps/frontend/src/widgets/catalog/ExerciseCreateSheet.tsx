import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, PlusIcon, SendIcon } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { useState } from 'react'

import { useSaveExercise } from '@/entities/admin'
import {
  type ExerciseCreateInput,
  exerciseCreateSchema,
  type ExerciseCreateValues,
  useCreateDraft,
  useDraftLimit,
  useUploadEntryImage,
} from '@/entities/catalog'
import { useSportUser } from '@/entities/sport-user'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { applyFieldErrors } from '@/shared/lib/form'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

import { ExerciseFields } from './ExerciseFields'
import { SimilarEntries } from './SimilarEntries'

const FORM_ID = 'exercise-create'

/** draft — только что ушло черновиком на модерацию (не похожее из справочника и не запись админа) */
export type CreatedExercise = { id: number; name: string; draft?: boolean }

type ExerciseCreateSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Созданное (или выбранное похожее из справочника) сразу уходит наружу вместо экрана «Готово» —
   * так замена на тренировке ставит его без лишних шагов
   */
  onCreated?: (exercise: CreatedExercise) => void
}

const CreateForm = ({
  isAdmin,
  onCreated,
}: {
  isAdmin: boolean
  onCreated: (exercise: CreatedExercise, pickedSimilar?: boolean) => void
}) => {
  const createDraft = useCreateDraft()
  const saveExercise = useSaveExercise()
  const upload = useUploadEntryImage()
  const pending = createDraft.isPending || saveExercise.isPending || upload.isPending
  const form = useForm<ExerciseCreateInput, unknown, ExerciseCreateValues>({
    resolver: zodResolver(exerciseCreateSchema),
    defaultValues: {
      name: '',
      technique: '',
      steps: [],
      mistakes: [],
      videoUrl: '',
      equipment: null,
      measure: 'REPS',
      imagePath: null,
      primary: [],
      secondary: [],
      jointIds: [],
    },
  })

  // Админ добавляет сразу в справочник, пользователь — черновиком на модерацию (business-tz, 5.5)
  const save = (values: ExerciseCreateValues): Promise<CreatedExercise> =>
    isAdmin
      ? saveExercise.mutateAsync({ id: null, ...values }).then(e => ({ id: e.id, name: e.name }))
      : createDraft
          .mutateAsync({
            kind: 'exercise',
            ...values,
            technique: values.technique ?? undefined,
            videoUrl: values.videoUrl ?? undefined,
            equipment: values.equipment ?? undefined,
            imagePath: values.imagePath ?? undefined,
          })
          // У только что созданного черновика запись есть всегда — null бывает лишь у удалённых
          .then(entry => ({ id: entry.entryId as number, name: values.name, draft: true }))

  return (
    <FormProvider {...form}>
      <form
        id={FORM_ID}
        className='flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain pt-1 pb-4'
        onSubmit={form.handleSubmit(values =>
          save(values)
            .then(created => onCreated(created))
            .catch(error => applyFieldErrors(error, form.setError)),
        )}
      >
        <ExerciseFields
          initialImageUrl={null}
          upload={upload}
          afterName={name => (
            <SimilarEntries
              kind='exercise'
              name={name}
              hint='Не то? Заполни поля ниже — создадим новое.'
              onPick={entry => onCreated(entry, true)}
            />
          )}
        />
      </form>
      <SheetFooter className='border-foreground/15 border-t-[1.5px]'>
        <Button
          type='submit'
          form={FORM_ID}
          size='lg'
          className='w-full'
          disabled={pending}
        >
          {isAdmin ? <PlusIcon strokeWidth={2.5} /> : <SendIcon />}
          {isAdmin ? 'Добавить в справочник' : 'На модерацию'}
        </Button>
      </SheetFooter>
    </FormProvider>
  )
}

// Новое упражнение (business-tz, 5.5): одна шторка для всех входов — справочник, замена на тренировке, админка
export const ExerciseCreateSheet = ({ open, onOpenChange, onCreated }: ExerciseCreateSheetProps) => {
  const navigate = useNavigate()
  const isAdmin = useSportUser().data?.isAdmin ?? false
  // Лимит заявок в сутки — только у пользователя: админ пишет в справочник напрямую
  const limit = useDraftLimit({ enabled: open && !isAdmin })
  const [created, setCreated] = useState<CreatedExercise | null>(null)
  const limitReached = !isAdmin && !!limit.data && limit.data.left <= 0

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) setCreated(null)
  }

  const done = (exercise: CreatedExercise, pickedSimilar?: boolean) => {
    if (onCreated) {
      onCreated(exercise)
      close(false)
    } else if (pickedSimilar) {
      // Похожее уже есть в справочнике — показываем его карточку вместо создания дубля
      close(false)
      void navigate(buildPath(ROUTES.EXERCISE, { exerciseId: exercise.id }))
    } else setCreated(exercise)
  }

  const title = created
    ? isAdmin
      ? 'Добавлено'
      : 'Отправлено'
    : limitReached
      ? 'Лимит на сегодня'
      : 'Новое упражнение'
  const description = created
    ? isAdmin
      ? `«${created.name}» уже в справочнике.`
      : `«${created.name}» — черновик. Его уже можно ставить в тренировки с пометкой «не проверено», бот напишет исход проверки.`
    : limitReached
      ? `Можно отправить ${limit.data?.limit} заявок в сутки. Завтра можно снова.`
      : isAdmin
        ? 'Запись сразу попадёт в справочник.'
        : 'Уйдёт администратору на проверку, а пока будет видна только тебе.'

  return (
    <Sheet
      open={open}
      onOpenChange={close}
    >
      <SheetContent className={created || limitReached ? undefined : 'data-[side=bottom]:h-[88svh]'}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {created ? (
          <div className='px-gutter flex flex-col gap-3 pb-6'>
            <ButtonLink
              to={buildPath(ROUTES.EXERCISE, { exerciseId: created.id })}
              variant='outline'
              className='w-full'
            >
              Открыть карточку
            </ButtonLink>
            <Button
              className='w-full'
              onClick={() => close(false)}
            >
              <CheckIcon strokeWidth={3} />
              Готово
            </Button>
          </div>
        ) : limitReached ? (
          <div className='px-gutter pb-6'>
            <Button
              variant='outline'
              className='w-full'
              onClick={() => close(false)}
            >
              Понятно
            </Button>
          </div>
        ) : (
          open && (
            <>
              {!isAdmin && limit.data && (
                <Text
                  size='sm'
                  tone='muted'
                  className='px-gutter pb-2'
                >
                  Осталось заявок на сегодня: {limit.data.left} из {limit.data.limit}
                </Text>
              )}
              <CreateForm
                isAdmin={isAdmin}
                onCreated={done}
              />
            </>
          )
        )}
      </SheetContent>
    </Sheet>
  )
}
