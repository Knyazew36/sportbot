import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import {
  lastSetHint,
  useAddSet,
  weightText,
  type WorkoutItem,
  type WorkoutSetInput,
  workoutSetSchema,
  type WorkoutSetValues,
} from '@/entities/workout'
import { applyFieldErrors } from '@/shared/lib/form'
import { BoxInput } from '@/shared/ui/kit/BoxInput'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

type SetEntryFormProps = {
  item: WorkoutItem
  /** Подход отправляется — экран закрепляет упражнение за собой */
  onSubmitStart: () => void
  onSaved: () => void
}

const SetEntryForm = ({ item, onSubmitStart, onSaved }: SetEntryFormProps) => {
  const add = useAddSet()
  const hint = lastSetHint(item.last, item.sets.length + 1)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<WorkoutSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(workoutSetSchema),
    // Поля открываются пустыми — прошлое значение только подсказкой
    defaultValues: { weight: '', reps: '' },
  })

  const submit = handleSubmit(values => {
    // Первый подход делает упражнение «сделанным», и без закрепления экран ушёл бы к следующему несделанному
    onSubmitStart()
    return add
      .mutateAsync({ itemId: item.id, ...values })
      .then(onSaved)
      .catch(error => applyFieldErrors(error, setError))
  })

  return (
    <form
      onSubmit={submit}
      autoComplete='off'
      className='flex flex-col gap-3 px-gutter pb-6'
    >
      <div className='grid grid-cols-2 gap-2'>
        <BoxInput
          label={item.bodyweight ? 'вес, если есть' : 'вес, кг'}
          placeholder={hint ? weightText(hint.weight) : item.bodyweight ? 'свой' : '0'}
          className='py-2 [&_input]:h-12 [&_input]:text-[40px]'
          autoFocus={!item.bodyweight}
          {...register('weight')}
        />
        <BoxInput
          label='повторы'
          inputMode='numeric'
          placeholder={hint ? String(hint.reps) : String(item.repsMax)}
          className='py-2 [&_input]:h-12 [&_input]:text-[40px]'
          autoFocus={item.bodyweight}
          {...register('reps')}
        />
      </div>
      <ErrorText errors={[errors.weight, errors.reps]} />
      <Button
        type='submit'
        size='xl'
        className='w-full'
        disabled={add.isPending}
      >
        <CheckIcon
          className='size-7'
          strokeWidth={3}
        />
        Записать подход
      </Button>
    </form>
  )
}

type SetEntrySheetProps = SetEntryFormProps & { open: boolean; onClose: () => void }

// Ввод подхода после «Закончил подход»: два крупных поля и одна кнопка (frontend-tz, 8.2)
export const SetEntrySheet = ({ open, onClose, item, onSubmitStart, onSaved }: SetEntrySheetProps) => {
  const hint = lastSetHint(item.last, item.sets.length + 1)
  const number = item.sets.length + 1
  return (
    <Sheet
      open={open}
      onOpenChange={next => !next && onClose()}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            Подход {number}
            {item.plannedSets > 0 && ` из ${item.plannedSets}`}
          </SheetTitle>
          <SheetDescription>
            {hint ? `Прошлый раз ${weightText(hint.weight)} × ${hint.reps}` : 'Сколько поднял и сколько раз'}
          </SheetDescription>
        </SheetHeader>
        {open && (
          <SetEntryForm
            key={number}
            item={item}
            onSubmitStart={onSubmitStart}
            onSaved={onSaved}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
