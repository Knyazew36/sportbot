import { GripVerticalIcon, PlusIcon, Trash2Icon, Unlink2Icon } from 'lucide-react'
import { Reorder, useDragControls } from 'motion/react'

import { useState } from 'react'

import {
  type ComplexExerciseValues,
  type ExerciseBlock,
  planText,
  type ProgramExercise,
  supersetLetter,
} from '@/entities/program'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet'

import { arrangeBy } from './arrange'
import { ExercisePlanForm } from './ExercisePlanForm'

type SupersetCardProps = {
  exercise: ProgramExercise
  label: string
  onDrop: () => void
  onOpen: () => void
}

// Карточка участника в ленте суперсета: тап открывает план и действия, ручка двигает по кругу
const SupersetCard = ({ exercise, label, onDrop, onOpen }: SupersetCardProps) => {
  const drag = useDragControls()
  return (
    <Reorder.Item
      value={exercise.id}
      dragListener={false}
      dragControls={drag}
      onDragEnd={onDrop}
      className='bg-background border-border flex w-38 shrink-0 snap-start flex-col border-[1.5px]'
      whileDrag={{ scale: 1.03, boxShadow: '6px 6px 0 var(--sb-blue)' }}
    >
      <div className='flex items-center justify-between pl-3'>
        <Eyebrow tone='primary'>{label}</Eyebrow>
        <button
          type='button'
          className='text-foreground/50 flex h-9 w-9 touch-none items-center justify-center'
          onPointerDown={e => drag.start(e)}
          aria-label={`Перетащить «${exercise.name}» в суперсете`}
        >
          <GripVerticalIcon className='size-4' />
        </button>
      </div>
      <button
        type='button'
        className='flex flex-1 flex-col items-start gap-1 px-3 pb-3 text-left'
        onClick={onOpen}
      >
        <Text
          size='sm'
          className='line-clamp-2 leading-tight'
        >
          {exercise.name}
        </Text>
        <Text
          size='xs'
          tone='muted'
          className='mt-auto'
        >
          {planText(exercise.sets, exercise.repsMin, exercise.repsMax, exercise.measure)}
          {exercise.draft && ' · не проверено'}
        </Text>
      </button>
    </Reorder.Item>
  )
}

type SupersetBlockProps = {
  block: ExerciseBlock<ProgramExercise> & { superset: number }
  onDrop: () => void
  /** Новый порядок участников внутри суперсета */
  onReorder: (ids: number[]) => void
  onPlanChange: (id: number, plan: ComplexExerciseValues) => Promise<unknown>
  onRemove: (id: number) => void
  onUngroupExercise: (id: number) => void
  onUngroup: () => void
  /** Подбор упражнений, которые встанут в этот суперсет */
  addTo: string
}

// Суперсет в редакторе: блок во всю ширину, участники — лентой в ряд. Делаются по кругу, отдых после круга
export const SupersetBlock = ({
  block,
  onDrop,
  onReorder,
  onPlanChange,
  onRemove,
  onUngroupExercise,
  onUngroup,
  addTo,
}: SupersetBlockProps) => {
  const drag = useDragControls()
  const letter = supersetLetter(block.superset)
  // Порядок под пальцем: на сервер уходит один раз, когда карточку отпустили
  const [dragOrder, setDragOrder] = useState<number[] | null>(null)
  const [openedId, setOpenedId] = useState<number | null>(null)
  const shown = arrangeBy(block.items, dragOrder ?? undefined)
  const opened = block.items.find(e => e.id === openedId) ?? null
  const close = () => setOpenedId(null)

  const dropCard = () => {
    if (!dragOrder) return
    if (dragOrder.some((id, i) => id !== block.items[i]?.id)) onReorder(dragOrder)
    setDragOrder(null)
  }

  return (
    <Reorder.Item
      value={block.key}
      dragListener={false}
      dragControls={drag}
      onDragEnd={onDrop}
      className='bg-background border-border border-b-[1.5px] py-3.5'
      whileDrag={{ scale: 1.02, boxShadow: '6px 6px 0 var(--sb-blue)' }}
    >
      <div className='flex items-center gap-2'>
        <button
          type='button'
          className='text-foreground/50 flex h-10 w-8 touch-none items-center justify-center'
          onPointerDown={e => drag.start(e)}
          aria-label={`Перетащить суперсет ${letter}`}
        >
          <GripVerticalIcon className='size-5' />
        </button>
        <div className='min-w-0 flex-1'>
          <Text
            size='lg'
            className='leading-tight'
          >
            Суперсет {letter}
          </Text>
          <Text
            size='xs'
            tone='muted'
          >
            по кругу, отдых после круга
          </Text>
        </div>
        <Button
          type='button'
          variant='outline'
          size='icon-sm'
          aria-label={`Разгруппировать суперсет ${letter}`}
          onClick={onUngroup}
        >
          <Unlink2Icon />
        </Button>
      </div>

      <Reorder.Group
        as='ol'
        axis='x'
        layoutScroll
        values={shown.map(e => e.id)}
        onReorder={setDragOrder}
        className='-mr-gutter pr-gutter mt-3 flex snap-x gap-2 overflow-x-auto pb-1 pl-10'
      >
        {shown.map((e, i) => (
          <SupersetCard
            key={e.id}
            exercise={e}
            label={`${letter}${i + 1}`}
            onDrop={dropCard}
            onOpen={() => setOpenedId(e.id)}
          />
        ))}
        <li className='flex shrink-0 snap-start'>
          <ButtonLink
            to={addTo}
            variant='outline'
            className='h-full w-16 flex-col'
            aria-label={`Добавить упражнение в суперсет ${letter}`}
          >
            <PlusIcon strokeWidth={2.5} />
          </ButtonLink>
        </li>
      </Reorder.Group>

      <ExerciseSheet
        exercise={opened && { id: opened.exerciseId, name: opened.name }}
        onOpenChange={open => !open && close()}
        action={
          opened && (
            <div className='flex flex-col gap-3'>
              <ExercisePlanForm
                exercise={opened}
                onPlanChange={plan => onPlanChange(opened.id, plan)}
              />
              <div className='grid grid-cols-2 gap-2'>
                <Button
                  variant='outline'
                  onClick={() => {
                    onUngroupExercise(opened.id)
                    close()
                  }}
                >
                  <Unlink2Icon />
                  Вынести
                </Button>
                <Button
                  variant='outline'
                  className='text-destructive'
                  onClick={() => {
                    onRemove(opened.id)
                    close()
                  }}
                >
                  <Trash2Icon />
                  Удалить
                </Button>
              </div>
            </div>
          )
        }
      />
    </Reorder.Item>
  )
}
