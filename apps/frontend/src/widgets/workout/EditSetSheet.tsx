import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import {
  useDeleteSet,
  useUpdateSet,
  type WorkoutSet,
  type WorkoutSetInput,
  workoutSetSchema,
  type WorkoutSetValues,
} from '@/entities/workout'
import { applyFieldErrors } from '@/shared/lib/form'
import { BoxInput } from '@/shared/ui/kit/BoxInput'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

const EditSetForm = ({ set, onClose }: { set: WorkoutSet; onClose: () => void }) => {
  const update = useUpdateSet()
  const remove = useDeleteSet()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<WorkoutSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(workoutSetSchema),
    defaultValues: { weight: set.weight ? String(set.weight) : '', reps: String(set.reps) },
  })

  return (
    <form
      className='flex flex-col gap-3 px-gutter pb-6'
      onSubmit={handleSubmit(values =>
        update
          .mutateAsync({ id: set.id, ...values })
          .then(onClose)
          .catch(error => applyFieldErrors(error, setError)),
      )}
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
      <Button
        type='submit'
        size='lg'
        className='w-full'
        disabled={update.isPending}
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
        onConfirm={() => remove.mutateAsync(set.id).then(onClose)}
      >
        <Trash2Icon />
        Удалить подход
      </ConfirmAction>
    </form>
  )
}

// Исправить или удалить сохранённый подход — в идущей тренировке и в прошедшей из статистики (frontend-tz, 8.2)
export const EditSetSheet = ({ set, onClose }: { set: WorkoutSet | null; onClose: () => void }) => (
  <Sheet
    open={set != null}
    onOpenChange={open => !open && onClose()}
  >
    <SheetContent side='bottom'>
      <SheetHeader>
        <SheetTitle>Подход {set?.number}</SheetTitle>
        <SheetDescription>Исправь вес или повторы. Пустой вес — свой вес.</SheetDescription>
      </SheetHeader>
      {set && (
        <EditSetForm
          key={set.id}
          set={set}
          onClose={onClose}
        />
      )}
    </SheetContent>
  </Sheet>
)
