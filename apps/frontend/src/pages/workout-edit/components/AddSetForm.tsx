import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import {
  newClientId,
  type TimeSetInput,
  timeSetSchema,
  useAddSet,
  type WorkoutItem,
  type WorkoutSetInput,
  workoutSetSchema,
  type WorkoutSetValues,
} from '@sportbot/api/entities/workout'
import { applyFieldErrors } from '@/shared/lib/form'
import { isTimed, timeLabel } from '@sportbot/api/lib/measure'
import { BoxInput } from '@/shared/ui/kit/BoxInput'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

const AddButton = ({ item, pending }: { item: WorkoutItem; pending: boolean }) => (
  <Button
    type='submit'
    size='icon-lg'
    disabled={pending}
    aria-label={`Добавить подход в «${item.name}»`}
  >
    <PlusIcon />
  </Button>
)

// Подход на время: одно поле — секунды или мм:сс
const TimeAddForm = ({ item }: { item: WorkoutItem }) => {
  const add = useAddSet()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TimeSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(timeSetSchema(item.measure)),
    defaultValues: { time: '' },
  })

  return (
    <form
      className='mt-3 flex flex-col gap-2'
      onSubmit={handleSubmit(values =>
        add
          .mutateAsync({ itemId: item.id, ...values, clientId: newClientId() })
          .then(() => reset({ time: '' }, { keepFieldsRef: true }))
          .catch(error => applyFieldErrors(error, setError)),
      )}
    >
      <div className='grid grid-cols-[1fr_auto] items-stretch gap-2'>
        <BoxInput
          label={`время, ${timeLabel(item.measure)}`}
          inputMode={item.measure === 'TIME' ? 'text' : 'numeric'}
          {...register('time')}
        />
        <AddButton
          item={item}
          pending={add.isPending}
        />
      </div>
      <ErrorText errors={errors.time} />
    </form>
  )
}

const RepsAddForm = ({ item }: { item: WorkoutItem }) => {
  const add = useAddSet()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<WorkoutSetInput, unknown, WorkoutSetValues>({
    resolver: zodResolver(workoutSetSchema),
    defaultValues: { weight: '', reps: '' },
  })

  return (
    <form
      className='mt-3 flex flex-col gap-2'
      onSubmit={handleSubmit(values =>
        add
          .mutateAsync({ itemId: item.id, ...values, clientId: newClientId() })
          .then(() => reset({ weight: '', reps: '' }, { keepFieldsRef: true }))
          .catch(error => applyFieldErrors(error, setError)),
      )}
    >
      <div className='grid grid-cols-[1fr_1fr_auto] items-stretch gap-2'>
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
        <AddButton
          item={item}
          pending={add.isPending}
        />
      </div>
      <ErrorText errors={[errors.weight, errors.reps]} />
    </form>
  )
}

// Дописать забытый подход в прошедшую тренировку: встаёт последним, упражнение засчитывается сделанным
export const AddSetForm = ({ item }: { item: WorkoutItem }) =>
  isTimed(item.measure) ? <TimeAddForm item={item} /> : <RepsAddForm item={item} />
