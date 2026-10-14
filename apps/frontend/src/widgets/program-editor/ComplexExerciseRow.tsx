import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import {
  type ComplexExerciseInput,
  complexExerciseSchema,
  type ComplexExerciseValues,
  type ProgramExercise,
} from '@/entities/program'
import { applyFieldErrors } from '@/shared/lib/form'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { ListRow } from '@/shared/ui/kit/ListRow'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
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

type ComplexExerciseRowProps = {
  exercise: ProgramExercise
  /** Сдвиг на одну позицию; undefined — двигать некуда */
  onMoveUp?: () => void
  onMoveDown?: () => void
  onPlanChange: (plan: ComplexExerciseValues) => Promise<unknown>
  onRemove: () => void
}

// Упражнение комплекса: план «3 × 8–12» правится на месте и сохраняется, когда фокус уходит из строки
export const ComplexExerciseRow = ({
  exercise,
  onMoveUp,
  onMoveDown,
  onPlanChange,
  onRemove,
}: ComplexExerciseRowProps) => {
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
    const same =
      plan.sets === exercise.sets && plan.repsMin === exercise.repsMin && plan.repsMax === exercise.repsMax
    if (same) return
    return onPlanChange(plan).catch(error => applyFieldErrors(error, setError))
  })

  return (
    <ListRow
      title={exercise.name}
      meta={exercise.muscles}
      trail={
        <div className='flex flex-col gap-1'>
          <Button
            variant='outline'
            size='icon-sm'
            aria-label='Выше'
            disabled={!onMoveUp}
            onClick={onMoveUp}
          >
            <ArrowUpIcon />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            aria-label='Ниже'
            disabled={!onMoveDown}
            onClick={onMoveDown}
          >
            <ArrowDownIcon />
          </Button>
        </div>
      }
    >
      {exercise.draft && (
        <Badge
          variant='outline'
          className='mt-2'
        >
          не проверено
        </Badge>
      )}
      <form
        onSubmit={save}
        // Сохраняем, только когда фокус ушёл из всей строки: переход между полями плана — ещё правка
        onBlur={e => {
          if (!e.currentTarget.contains(e.relatedTarget)) void save()
        }}
        className='mt-2 flex items-start gap-1.5'
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
        <Button
          type='button'
          variant='outline'
          size='icon-sm'
          className='text-destructive ml-auto'
          aria-label={`Удалить «${exercise.name}» из комплекса`}
          onClick={onRemove}
        >
          <Trash2Icon />
        </Button>
      </form>
      <ErrorText
        className='mt-2'
        errors={[errors.sets, errors.repsMin, errors.repsMax]}
      />
    </ListRow>
  )
}
