import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
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

import { setCaption } from './set-caption'

/** Отправка не прошла: поля открываются снова с тем, что ввёл человек, и с ошибкой сервера под полем */
type Retry = { values: WorkoutSetInput; error: unknown }

type SetEntryFormProps = {
  item: WorkoutItem
  retry: Retry | null
  onSubmit: (values: WorkoutSetValues, input: WorkoutSetInput) => void
}

const SetEntryForm = ({ item, retry, onSubmit }: SetEntryFormProps) => {
  const hint = lastSetHint(item.last, item.sets.length + 1)
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<WorkoutSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(workoutSetSchema),
    // Поля открываются пустыми — прошлое значение только подсказкой
    defaultValues: retry?.values ?? { weight: '', reps: '' },
  })

  useEffect(() => {
    if (retry) applyFieldErrors(retry.error, setError)
  }, [retry, setError])

  return (
    <form
      onSubmit={handleSubmit(values => onSubmit(values, getValues()))}
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

type SetEntrySheetProps = {
  open: boolean
  item: WorkoutItem
  onClose: () => void
  /** Подход отправляется — экран закрепляет упражнение за собой */
  onSubmitStart: () => void
  /** Подход принят к отправке: экран идёт дальше (отдых), не дожидаясь сервера */
  onSaved: () => void
  /** Сервер не принял подход — открыть ввод снова */
  onFailed: () => void
}

// Ввод подхода после «Закончил подход»: два крупных поля и одна кнопка (frontend-tz, 8.2).
// Отправка не держит экран: шторка закрывается сразу, подход виден в списке до ответа сервера.
// Мутация живёт здесь, а не в форме: форма размонтируется вместе с закрытой шторкой раньше ответа
export const SetEntrySheet = ({ open, item, onClose, onSubmitStart, onSaved, onFailed }: SetEntrySheetProps) => {
  const add = useAddSet()
  const [retry, setRetry] = useState<Retry | null>(null)
  const hint = lastSetHint(item.last, item.sets.length + 1)
  const number = item.sets.length + 1

  const submit = (values: WorkoutSetValues, input: WorkoutSetInput) => {
    // Первый подход делает упражнение «сделанным», и без закрепления экран ушёл бы к следующему несделанному
    onSubmitStart()
    setRetry(null)
    // Клавиатура уходит вместе со шторкой, а не после неё
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    onSaved()
    add.mutate(
      { itemId: item.id, ...values },
      {
        onError: error => {
          setRetry({ values: input, error })
          onFailed()
        },
      },
    )
  }

  return (
    <Sheet
      open={open}
      onOpenChange={next => !next && onClose()}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{setCaption(number, item.plannedSets)}</SheetTitle>
          <SheetDescription>
            {retry
              ? 'Подход не сохранился — проверь и отправь ещё раз'
              : hint
                ? `Прошлый раз ${weightText(hint.weight)} × ${hint.reps}`
                : 'Сколько поднял и сколько раз'}
          </SheetDescription>
        </SheetHeader>
        {open && (
          <SetEntryForm
            key={number}
            item={item}
            retry={retry}
            onSubmit={submit}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
