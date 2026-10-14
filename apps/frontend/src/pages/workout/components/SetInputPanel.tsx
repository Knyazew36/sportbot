import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRightIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useForm } from 'react-hook-form'

import {
  lastSetHint,
  useAddSet,
  weightText,
  type Workout,
  type WorkoutItem,
  type WorkoutSetInput,
  workoutSetSchema,
  type WorkoutSetValues,
} from '@/entities/workout'
import { applyFieldErrors } from '@/shared/lib/form'
import { cn } from '@/shared/lib/utils'
import type { useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer'
import { BoxInput } from '@/shared/ui/kit/BoxInput'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { InkPanel } from '@/shared/ui/kit/InkPanel'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { RestTimer } from './RestTimer'

type SetInputPanelProps = {
  item: WorkoutItem
  settings: Workout['settings']
  timer: ReturnType<typeof useDeadlineTimer>
}

// Ввод подхода прибит к таймеру внизу, у большого пальца (frontend-tz, 8.2 и 15)
export const SetInputPanel = ({ item, settings, timer }: SetInputPanelProps) => {
  const add = useAddSet()
  const number = item.sets.length + 1
  const hint = lastSetHint(item.last, number)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<WorkoutSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(workoutSetSchema),
    // Поля открываются пустыми — прошлое значение только подсказкой
    defaultValues: { weight: '', reps: '' },
  })

  const submit = handleSubmit(values =>
    add
      .mutateAsync({ itemId: item.id, ...values })
      .then(() => {
        reset({ weight: '', reps: '' })
        if (settings.showRestTimer && settings.restAutoStart) timer.start(settings.restSeconds)
      })
      .catch(error => applyFieldErrors(error, setError)),
  )

  return (
    <motion.section
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 28, delay: 0.2 }}
      className='sticky bottom-0 z-30 mt-auto'
    >
      <form
        onSubmit={submit}
        className={cn(
          'border-primary relative border-t-2 bg-[color-mix(in_oklab,var(--sb-blue)_9%,var(--sb-paper))] px-5 pt-2.5',
          settings.showRestTimer ? 'pb-3' : 'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        )}
      >
        <div className='flex items-baseline justify-between gap-2'>
          <Eyebrow tone='primary'>Подход {number}</Eyebrow>
          {hint && (
            <Eyebrow>
              прошлый раз {weightText(hint.weight)} × {hint.reps}
            </Eyebrow>
          )}
        </div>
        <div className='mt-2 grid grid-cols-[1fr_1fr_auto] gap-2'>
          <BoxInput
            label={item.bodyweight ? 'вес, если есть' : 'вес, кг'}
            placeholder={hint ? weightText(hint.weight) : item.bodyweight ? 'свой' : '0'}
            {...register('weight')}
          />
          <BoxInput
            label='повторы'
            inputMode='numeric'
            placeholder={hint ? String(hint.reps) : String(item.repsMax)}
            {...register('reps')}
          />
          <Button
            type='submit'
            className='h-auto gap-1.5 px-3.5'
            disabled={add.isPending}
          >
            Далее
            <ArrowRightIcon
              className='size-5'
              strokeWidth={3}
            />
          </Button>
        </div>
        <ErrorText
          className='mt-1.5'
          errors={[errors.weight, errors.reps]}
        />
      </form>
      {/* Таймер выключен в профиле — внизу остаётся только ввод подхода */}
      {settings.showRestTimer && (
        <InkPanel className='pb-[max(1rem,env(safe-area-inset-bottom))]'>
          <RestTimer
            timer={timer}
            restSeconds={settings.restSeconds}
            nextSet={number}
          />
        </InkPanel>
      )}
    </motion.section>
  )
}
