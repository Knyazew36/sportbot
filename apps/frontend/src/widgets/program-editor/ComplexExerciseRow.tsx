import { GripVerticalIcon, Link2Icon, Trash2Icon } from 'lucide-react'
import { Reorder, useDragControls } from 'motion/react'

import type { ComplexExerciseValues, ProgramExercise } from '@/entities/program'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'

import { ExercisePlanForm } from './ExercisePlanForm'

type ComplexExerciseRowProps = {
  exercise: ProgramExercise
  /** Ключ блока в перетаскивании комплекса */
  value: string
  /** Строку отпустили после перетаскивания — сохранить новый порядок */
  onDrop: () => void
  onPlanChange: (plan: ComplexExerciseValues) => Promise<unknown>
  onRemove: () => void
  /** Открыть карточку упражнения: фото, мышцы, техника */
  onView: () => void
  /** Подбор упражнений, которые встанут с этим в суперсет */
  supersetTo: string
}

// Одиночное упражнение комплекса: план «3 × 8–12» правится на месте и сохраняется, когда фокус уходит из строки
export const ComplexExerciseRow = ({
  exercise,
  value,
  onDrop,
  onPlanChange,
  onRemove,
  onView,
  supersetTo,
}: ComplexExerciseRowProps) => {
  // Перетаскивание только за ручку: иначе прокрутка пальцем и ввод в поля хватали бы строку
  const drag = useDragControls()

  return (
    <Reorder.Item
      value={value}
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
        {/* Тап по названию открывает карточку, как в ленте суперсета: отдельная кнопка не влезала в ряд плана */}
        <button
          type='button'
          className='block w-full text-left'
          aria-label={`Посмотреть «${exercise.name}»`}
          onClick={onView}
        >
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
        </button>
        {exercise.draft && (
          <Badge
            variant='outline'
            className='mt-2'
          >
            не проверено
          </Badge>
        )}
        <ExercisePlanForm
          exercise={exercise}
          onPlanChange={onPlanChange}
          className='mt-2'
        >
          <ButtonLink
            to={supersetTo}
            variant='outline'
            size='icon-sm'
            className='ml-auto'
            aria-label={`Собрать суперсет с «${exercise.name}»`}
          >
            <Link2Icon />
          </ButtonLink>
          <Button
            type='button'
            variant='outline'
            size='icon-sm'
            className='text-destructive'
            aria-label={`Удалить «${exercise.name}» из тренировки`}
            onClick={onRemove}
          >
            <Trash2Icon />
          </Button>
        </ExercisePlanForm>
      </div>
    </Reorder.Item>
  )
}
