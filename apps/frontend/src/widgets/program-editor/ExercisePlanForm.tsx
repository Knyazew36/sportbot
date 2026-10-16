import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import type { ReactNode } from 'react'

import {
  type ComplexExerciseInput,
  complexExerciseSchema,
  type ComplexExerciseValues,
  type ProgramExercise,
} from '@/entities/program'
import { applyFieldErrors } from '@/shared/lib/form'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Input } from '@/shared/ui/shadcn/input'

const CELL = 'sb-poster h-9 px-1 text-center text-[20px]'

// Мелкая подпись под полем плана: без неё «3 × 8–12» читается не всеми
const Caption = ({ children }: { children: string }) => (
  <Text
    as='span'
    size='2xs'
    tone='muted'
    className='text-center whitespace-nowrap'
  >
    {children}
  </Text>
)

type ExercisePlanFormProps = {
  exercise: ProgramExercise
  onPlanChange: (plan: ComplexExerciseValues) => Promise<unknown>
  /** Кнопки в конце ряда полей: посмотреть, удалить */
  children?: ReactNode
  className?: string
}

// План «3 × 8–12» правится на месте и сохраняется, когда фокус уходит из формы
export const ExercisePlanForm = ({ exercise, onPlanChange, children, className }: ExercisePlanFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ComplexExerciseInput, unknown, ComplexExerciseValues>({
    resolver: zodResolver(complexExerciseSchema),
    // values, а не defaultValues: после сохранения или правки в боте поля встают в новое значение
    values: {
      sets: String(exercise.sets),
      repsMin: String(exercise.repsMin),
      repsMax: String(exercise.repsMax),
    },
  })

  const save = handleSubmit(plan => {
    const same = plan.sets === exercise.sets && plan.repsMin === exercise.repsMin && plan.repsMax === exercise.repsMax
    if (same) return
    return onPlanChange(plan).catch(error => applyFieldErrors(error, setError))
  })

  return (
    <div className={className}>
      <form
        onSubmit={save}
        // Сохраняем, только когда фокус ушёл из всей формы: переход между полями плана — ещё правка
        onBlur={e => {
          if (!e.currentTarget.contains(e.relatedTarget)) void save()
        }}
        className='flex items-start gap-1.5'
      >
        <label className='flex flex-col items-center gap-1'>
          <Input
            inputMode='numeric'
            className={`${CELL} w-11`}
            aria-label='Подходов'
            aria-invalid={!!errors.sets}
            {...register('sets')}
          />
          <Caption>подх.</Caption>
        </label>
        <Poster
          as='span'
          size='sm'
          className='leading-9'
        >
          ×
        </Poster>
        <div className='flex flex-col items-center gap-1'>
          <div className='flex items-center gap-1.5'>
            <Input
              inputMode='numeric'
              className={`${CELL} w-12`}
              aria-label='Повторов от'
              aria-invalid={!!errors.repsMin}
              {...register('repsMin')}
            />
            <Poster
              as='span'
              size='sm'
            >
              –
            </Poster>
            <Input
              inputMode='numeric'
              className={`${CELL} w-12`}
              aria-label='Повторов до'
              aria-invalid={!!errors.repsMax}
              {...register('repsMax')}
            />
          </div>
          <Caption>повт.</Caption>
        </div>
        {/* Enter на телефонной клавиатуре отправляет форму — отдельная кнопка не нужна */}
        <button
          type='submit'
          hidden
        />
        {children}
      </form>
      <ErrorText
        className='mt-2'
        errors={[errors.sets, errors.repsMin, errors.repsMax]}
      />
    </div>
  )
}
