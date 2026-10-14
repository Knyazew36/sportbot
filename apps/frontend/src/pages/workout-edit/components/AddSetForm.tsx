import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { useAddSet, type WorkoutItem, type WorkoutSetInput, workoutSetSchema, type WorkoutSetValues } from '@/entities/workout'
import { applyFieldErrors } from '@/shared/lib/form'
import { BoxInput } from '@/shared/ui/kit/BoxInput'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Дописать забытый подход в прошедшую тренировку: встаёт последним, упражнение засчитывается сделанным
export const AddSetForm = ({ item }: { item: WorkoutItem }) => {
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
          .mutateAsync({ itemId: item.id, ...values })
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
        <Button
          type='submit'
          size='icon-lg'
          disabled={add.isPending}
          aria-label={`Добавить подход в «${item.name}»`}
        >
          <PlusIcon />
        </Button>
      </div>
      <ErrorText errors={[errors.weight, errors.reps]} />
    </form>
  )
}
