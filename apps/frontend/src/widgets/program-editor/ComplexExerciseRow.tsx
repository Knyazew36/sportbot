import { zodResolver } from '@hookform/resolvers/zod'
import { EyeIcon, GripVerticalIcon, Trash2Icon } from 'lucide-react'
import { Reorder, useDragControls } from 'motion/react'
import { useForm } from 'react-hook-form'

import {
  type ComplexExerciseInput,
  complexExerciseSchema,
  type ComplexExerciseValues,
  type ProgramExercise,
} from '@/entities/program'
import { applyFieldErrors } from '@/shared/lib/form'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
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
  /** Строку отпустили после перетаскивания — сохранить новый порядок */
  onDrop: () => void
  onPlanChange: (plan: ComplexExerciseValues) => Promise<unknown>
  onRemove: () => void
  /** Открыть карточку упражнения: фото, мышцы, техника */
  onView: () => void
}

// Упражнение комплекса: план «3 × 8–12» правится на месте и сохраняется, когда фокус уходит из строки
export const ComplexExerciseRow = ({ exercise, onDrop, onPlanChange, onRemove, onView }: ComplexExerciseRowProps) => {
  // Перетаскивание только за ручку: иначе прокрутка пальцем и ввод в поля хватали бы строку
  const drag = useDragControls()
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
    <Reorder.Item
      value={exercise.id}
      dragListener={false}
      dragControls={drag}
      onDragEnd={onDrop}
      className='bg-background border-border grid grid-cols-[auto_1fr] items-start gap-x-2 border-b-[1.5px] py-3.5'
      whileDrag={{ scale: 1.02, boxShadow: '6px 6px 0 var(--sb-blue)' }}
    >
      <button
        type='button'
        className='text-foreground/50 flex h-10 w-8 touch-none items-center justify-center'
        onPointerDown={e => drag.start(e)}
        aria-label={`Перетащить «${exercise.name}»`}
      >
        <GripVerticalIcon className='size-5' />
      </button>
      <div className='min-w-0'>
        <Text
          size='lg'
          className='leading-tight'
        >
          {exercise.name}
        </Text>
        <Text
          size='xs'
          tone='muted'
          className='mt-1'
        >
          {exercise.muscles}
        </Text>
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
            className='ml-auto'
            aria-label={`Посмотреть «${exercise.name}»`}
            onClick={onView}
          >
            <EyeIcon />
          </Button>
          <Button
            type='button'
            variant='outline'
            size='icon-sm'
            className='text-destructive'
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
      </div>
    </Reorder.Item>
  )
}
