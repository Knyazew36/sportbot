import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDownIcon, GripVerticalIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { AnimatePresence, motion, Reorder, useDragControls } from 'motion/react'
import { useForm } from 'react-hook-form'

import {
  complexLetter,
  type ComplexNameValues,
  complexNameSchema,
  type ProgramComplex,
} from '@/entities/program'
import { applyFieldErrors } from '@/shared/lib/form'
import { cn } from '@/shared/lib/utils'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { List } from '@/shared/ui/kit/ListRow'
import { TextField } from '@/shared/ui/kit/TextField'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'

import { ComplexExerciseRow } from './ComplexExerciseRow'
import type { ComplexEditorActions } from './ProgramComplexList'

type ProgramComplexCardProps = {
  complex: ProgramComplex
  index: number
  expanded: boolean
  onToggle: () => void
  /** Карточку отпустили после перетаскивания — сохранить новый порядок */
  onDrop: () => void
  actions: ComplexEditorActions
  /** Страница подбора упражнений в этот комплекс */
  addExerciseTo: string
}

type ComplexNameFormProps = { complex: ProgramComplex; onRename: ComplexEditorActions['renameComplex'] }

const ComplexNameForm = ({ complex, onRename }: ComplexNameFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ComplexNameValues>({
    resolver: zodResolver(complexNameSchema),
    values: { name: complex.name },
  })

  const save = handleSubmit(({ name }) => {
    if (name === complex.name) return
    return onRename(complex.id, name).catch(error => applyFieldErrors(error, setError))
  })

  return (
    <form onSubmit={save}>
      <TextField
        label='Название комплекса'
        error={errors.name}
        {...register('name', { onBlur: () => void save() })}
      />
    </form>
  )
}

// Комплекс в очереди программы: перетаскивание за ручку, название, упражнения с планом, удаление
export const ProgramComplexCard = ({
  complex,
  index,
  expanded,
  onToggle,
  onDrop,
  actions,
  addExerciseTo,
}: ProgramComplexCardProps) => {
  // Перетаскивание только за ручку: иначе прокрутка экрана пальцем хватала бы карточки
  const drag = useDragControls()
  const ids = complex.exercises.map(e => e.id)

  const move = (from: number, to: number) => {
    const next = [...ids]
    next.splice(to, 0, ...next.splice(from, 1))
    actions.reorderExercises(complex.id, next)
  }

  return (
    <Reorder.Item
      value={complex.id}
      dragListener={false}
      dragControls={drag}
      onDragEnd={onDrop}
      className={cn('bg-background border-[1.5px]', complex.isNext ? 'border-primary' : 'border-foreground/80')}
      whileDrag={{ scale: 1.02, boxShadow: '6px 6px 0 var(--sb-blue)' }}
    >
      <div className='grid grid-cols-[auto_auto_1fr_auto] items-center gap-2 p-2 pr-3'>
        <button
          type='button'
          className='text-foreground/50 flex size-10 touch-none items-center justify-center'
          onPointerDown={e => drag.start(e)}
          aria-label={`Перетащить комплекс «${complex.name}»`}
        >
          <GripVerticalIcon className='size-5' />
        </button>
        <Poster
          as='span'
          size='xl'
          tone={complex.isNext ? 'primary' : 'faint'}
          className='w-8'
        >
          {complexLetter(index)}
        </Poster>
        <button
          type='button'
          onClick={onToggle}
          className='min-w-0 text-left'
          aria-expanded={expanded}
        >
          <Text
            as='span'
            size='lg'
            className='block truncate'
          >
            {complex.name}
          </Text>
          <Text
            as='span'
            size='xs'
            tone='muted'
            className='mt-0.5 flex items-center gap-2'
          >
            {complex.exercises.length} упр.
            {complex.isNext && <Badge className='h-5'>следующий</Badge>}
          </Text>
        </button>
        <Button
          variant='outline'
          size='icon-sm'
          onClick={onToggle}
          aria-label={expanded ? 'Свернуть' : 'Развернуть'}
        >
          <ChevronDownIcon className={cn('transition-transform', expanded && 'rotate-180')} />
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className='overflow-hidden'
          >
            <div className='border-border flex flex-col gap-3 border-t-[1.5px] p-3'>
              <ComplexNameForm
                complex={complex}
                onRename={actions.renameComplex}
              />
              {complex.exercises.length > 0 && (
                <List>
                  {complex.exercises.map((e, i) => (
                    <ComplexExerciseRow
                      key={e.id}
                      exercise={e}
                      index={i}
                      onMoveUp={i > 0 ? () => move(i, i - 1) : undefined}
                      onMoveDown={i < ids.length - 1 ? () => move(i, i + 1) : undefined}
                      onPlanChange={plan => actions.updateExercise(e.id, plan)}
                      onRemove={() => actions.deleteExercise(e.id)}
                    />
                  ))}
                </List>
              )}
              <div className='flex flex-wrap gap-2'>
                <ButtonLink
                  to={addExerciseTo}
                  variant='outline'
                  size='sm'
                >
                  <PlusIcon strokeWidth={2.5} />
                  Упражнение
                </ButtonLink>
                <ConfirmAction
                  trigger={
                    <Button
                      variant='destructive'
                      size='sm'
                    />
                  }
                  title={`Удалить «${complex.name}»?`}
                  description='Комплекс пропадёт из очереди. История тренировок по нему сохранится.'
                  confirmLabel='Удалить'
                  onConfirm={() => actions.deleteComplex(complex.id)}
                >
                  <Trash2Icon />
                  Удалить комплекс
                </ConfirmAction>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
}
