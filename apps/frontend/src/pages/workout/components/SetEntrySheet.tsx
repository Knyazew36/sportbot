import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import {
  lastSetHint,
  newClientId,
  restText,
  type SetTiming,
  type TimeSetInput,
  timeSetSchema,
  useAddSet,
  weightText,
  type WorkoutItem,
  type WorkoutSetInput,
  workoutSetSchema,
  type WorkoutSetValues,
} from '@sportbot/api/entities/workout'
import { durationText, isTimed, timeInput, timeLabel } from '@sportbot/api/lib/measure'
import { BoxInput } from '@/shared/ui/kit/BoxInput'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

import { setCaption } from './set-caption'

type SetEntryFormProps = {
  item: WorkoutItem
  onSubmit: (values: WorkoutSetValues) => void
}

const SetEntryForm = ({ item, onSubmit }: SetEntryFormProps) => {
  const hint = lastSetHint(item.last, item.sets.length + 1)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkoutSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(workoutSetSchema),
    // Поля открываются пустыми — прошлое значение только подсказкой
    defaultValues: { weight: '', reps: '' },
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
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

type TimeEntryFormProps = {
  item: WorkoutItem
  /** Время по секундомеру: подставляется в поле, его можно поправить */
  elapsed: number | undefined
  onSubmit: (values: WorkoutSetValues) => void
}

// Подход на время: одно поле. По секундомеру время уже вписано — остаётся нажать кнопку
const TimeEntryForm = ({ item, elapsed, onSubmit }: TimeEntryFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TimeSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(timeSetSchema(item.measure)),
    defaultValues: { time: elapsed ? timeInput(item.measure, elapsed) : '' },
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      autoComplete='off'
      className='flex flex-col gap-3 px-gutter pb-6'
    >
      <BoxInput
        label={`время, ${timeLabel(item.measure)}`}
        inputMode={item.measure === 'TIME' ? 'text' : 'numeric'}
        placeholder={timeInput(item.measure, item.repsMax)}
        className='py-2 [&_input]:h-12 [&_input]:text-[40px]'
        autoFocus={!elapsed}
        {...register('time')}
      />
      <ErrorText errors={errors.time} />
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
  /** Время подхода на момент записи */
  timing: () => SetTiming
  onClose: () => void
  /** Подход отправляется — экран закрепляет упражнение за собой */
  onSubmitStart: () => void
  /** Подход принят к отправке: экран идёт дальше (отдых), не дожидаясь сервера */
  onSaved: () => void
}

// Ввод подхода после «Закончил подход»: два крупных поля и одна кнопка (frontend-tz, 8.2).
// Отправка не держит экран: подход встаёт в офлайн-очередь, шторка закрывается сразу,
// подход виден в списке с меткой «ждёт отправки», пока сервер его не принял
export const SetEntrySheet = ({ open, item, timing, onClose, onSubmitStart, onSaved }: SetEntrySheetProps) => {
  const add = useAddSet()
  const hint = lastSetHint(item.last, item.sets.length + 1)
  const number = item.sets.length + 1
  const timed = isTimed(item.measure)

  const submit = (values: WorkoutSetValues) => {
    // До onSaved: он останавливает секундомер, и время подхода пропало бы
    const time = timing()
    // Первый подход делает упражнение «сделанным», и без закрепления экран ушёл бы к следующему несделанному
    onSubmitStart()
    // Клавиатура уходит вместе со шторкой, а не после неё
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    onSaved()
    add.mutate({ itemId: item.id, ...values, ...time, clientId: newClientId() })
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
            {/* Отдых прошлого раза рядом с весом: видно, сколько тогда сидел перед этим подходом */}
            {timed
              ? hint
                ? `Прошлый раз ${durationText(hint.reps)}`
                : 'Сколько по времени'
              : hint
                ? `Прошлый раз ${weightText(hint.weight)} × ${hint.reps}`
                : 'Сколько поднял и сколько раз'}
            {hint?.restBeforeSeconds != null && ` · отдых ${restText(hint.restBeforeSeconds)}`}
          </SheetDescription>
        </SheetHeader>
        {open &&
          (timed ? (
            <TimeEntryForm
              key={number}
              item={item}
              elapsed={timing().workSeconds ?? undefined}
              onSubmit={submit}
            />
          ) : (
            <SetEntryForm
              key={number}
              item={item}
              onSubmit={submit}
            />
          ))}
      </SheetContent>
    </Sheet>
  )
}
