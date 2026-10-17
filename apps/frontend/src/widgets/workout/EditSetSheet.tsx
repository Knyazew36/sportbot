import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import {
  type TimeSetInput,
  timeSetSchema,
  useDeleteSet,
  useUpdateSet,
  type WorkoutSet,
  type WorkoutSetInput,
  workoutSetSchema,
  type WorkoutSetValues,
} from '@/entities/workout'
import { isTimed, type Measure, timeInput, timeLabel } from '@/shared/lib/measure'
import { BoxInput } from '@/shared/ui/kit/BoxInput'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

/** Подход в правке и мера его упражнения: у упражнения на время правится одно поле — время */
export type EditingSet = { set: WorkoutSet; measure: Measure }

const RepsFields = ({ set, onSave }: { set: WorkoutSet; onSave: (values: WorkoutSetValues) => void }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkoutSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(workoutSetSchema),
    defaultValues: { weight: set.weight ? String(set.weight) : '', reps: String(set.reps) },
  })
  return (
    <form
      id='edit-set'
      className='flex flex-col gap-3'
      onSubmit={handleSubmit(onSave)}
    >
      <div className='grid grid-cols-2 gap-2'>
        <BoxInput
          label='вес, кг'
          placeholder='свой'
          {...register('weight')}
        />
        <BoxInput
          label='повторы'
          inputMode='numeric'
          {...register('reps')}
        />
      </div>
      <ErrorText errors={[errors.weight, errors.reps]} />
    </form>
  )
}

const TimeFields = ({
  set,
  measure,
  onSave,
}: {
  set: WorkoutSet
  measure: Measure
  onSave: (values: WorkoutSetValues) => void
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TimeSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(timeSetSchema(measure)),
    defaultValues: { time: timeInput(measure, set.reps) },
  })
  return (
    <form
      id='edit-set'
      className='flex flex-col gap-3'
      onSubmit={handleSubmit(onSave)}
    >
      <BoxInput
        label={`время, ${timeLabel(measure)}`}
        inputMode={measure === 'TIME' ? 'text' : 'numeric'}
        {...register('time')}
      />
      <ErrorText errors={errors.time} />
    </form>
  )
}

const EditSetForm = ({ editing: { set, measure }, onClose }: { editing: EditingSet; onClose: () => void }) => {
  const update = useUpdateSet()
  const remove = useDeleteSet()
  const ref = { id: set.id, clientId: set.clientId }
  // Правка встаёт в офлайн-очередь и видна в списке сразу — шторка не ждёт сервер
  const save = (values: WorkoutSetValues) => {
    update.mutate({ ...ref, ...values })
    onClose()
  }

  return (
    <div className='flex flex-col gap-3 px-gutter pb-6'>
      {isTimed(measure) ? (
        <TimeFields
          set={set}
          measure={measure}
          onSave={save}
        />
      ) : (
        <RepsFields
          set={set}
          onSave={save}
        />
      )}
      <Button
        type='submit'
        form='edit-set'
        size='lg'
        className='w-full'
      >
        Сохранить
      </Button>
      <ConfirmAction
        trigger={
          <Button
            type='button'
            variant='destructive'
            className='w-full'
          />
        }
        title={`Удалить подход ${set.number}?`}
        confirmLabel='Удалить'
        onConfirm={() => {
          remove.mutate(ref)
          onClose()
        }}
      >
        <Trash2Icon />
        Удалить подход
      </ConfirmAction>
    </div>
  )
}

// Исправить или удалить сохранённый подход — в идущей тренировке и в прошедшей из статистики (frontend-tz, 8.2)
export const EditSetSheet = ({ editing, onClose }: { editing: EditingSet | null; onClose: () => void }) => (
  <Sheet
    open={editing != null}
    onOpenChange={open => !open && onClose()}
  >
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Подход {editing?.set.number}</SheetTitle>
        <SheetDescription>
          {editing && isTimed(editing.measure) ? 'Исправь время подхода.' : 'Исправь вес или повторы. Пустой вес — свой вес.'}
        </SheetDescription>
      </SheetHeader>
      {editing && (
        <EditSetForm
          key={editing.set.clientId ?? editing.set.id}
          editing={editing}
          onClose={onClose}
        />
      )}
    </SheetContent>
  </Sheet>
)
