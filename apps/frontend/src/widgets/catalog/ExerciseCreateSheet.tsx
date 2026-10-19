import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, PlusIcon } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { useState } from 'react'

import { useSaveExercise } from '@/entities/admin'
import {
  type ExerciseCreateInput,
  exerciseCreateSchema,
  type ExerciseCreateValues,
  useCreateDraft,
  useUploadEntryImage,
} from '@/entities/catalog'
import { useSportUser } from '@/entities/sport-user'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { applyFieldErrors } from '@/shared/lib/form'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

import { ExerciseFields } from './ExerciseFields'
import { SimilarEntries } from './SimilarEntries'

const FORM_ID = 'exercise-create'

/** draft — только что создано личной записью (не похожее из справочника и не запись админа) */
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

  // Админ добавляет сразу в справочник, пользователь — личной записью; публикация — отдельно, с карточки
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
          .then(entry => ({ id: entry.id, name: entry.name, draft: true }))

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
          <PlusIcon strokeWidth={2.5} />
          {isAdmin ? 'Добавить в справочник' : 'Сохранить'}
        </Button>
      </SheetFooter>
    </FormProvider>
  )
}

// Новое упражнение (business-tz, 5.5): одна шторка для всех входов — справочник, замена на тренировке, админка
export const ExerciseCreateSheet = ({ open, onOpenChange, onCreated }: ExerciseCreateSheetProps) => {
  const navigate = useNavigate()
  const isAdmin = useSportUser().data?.isAdmin ?? false
  const [created, setCreated] = useState<CreatedExercise | null>(null)

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

  const title = created ? (isAdmin ? 'Добавлено' : 'Сохранено') : 'Новое упражнение'
  const description = created
    ? isAdmin
      ? `«${created.name}» уже в справочнике.`
      : `«${created.name}» уже можно ставить в тренировки. Чтобы оно появилось в общем справочнике, нажми «Опубликовать» на карточке.`
    : isAdmin
      ? 'Запись сразу попадёт в справочник.'
      : 'Будет видна только тебе. В общий справочник — по кнопке «Опубликовать», после проверки.'

  return (
    <Sheet
      open={open}
      onOpenChange={close}
    >
      <SheetContent className={created ? undefined : 'data-[side=bottom]:h-[88svh]'}>
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
        ) : (
          open && (
            <CreateForm
              isAdmin={isAdmin}
              onCreated={done}
            />
          )
        )}
      </SheetContent>
    </Sheet>
  )
}
