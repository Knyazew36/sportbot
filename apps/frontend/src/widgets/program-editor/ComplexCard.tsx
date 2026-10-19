import { ChevronDownIcon, GripVerticalIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react'
import { AnimatePresence, motion, Reorder, useDragControls } from 'motion/react'

import { EXERCISE_FORMS } from '@/shared/lib/plural-forms'
import { cn } from '@/shared/lib/utils'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { pluralize } from '@front-cmdt/utils/pluralize'

import type { EditorComplex, EditorExercise } from './types'

export const LETTERS = 'ABCDEFGHIJ'

// ── Комплекс ────────────────────────────────────────────────────────────────

type ComplexCardProps = {
  complex: EditorComplex
  index: number
  isNext: boolean
  expanded: boolean
  onToggle: () => void
  onChange: (complex: EditorComplex) => void
  onDelete: () => void
  /** Страница подбора упражнений в этот комплекс */
  addExerciseTo: string
}

export const ComplexCard = ({
  complex,
  index,
  isNext,
  expanded,
  onToggle,
  onChange,
  onDelete,
  addExerciseTo,
}: ComplexCardProps) => {
  // Перетаскивание только за ручку: иначе прокрутка экрана пальцем хватала бы карточки
  const drag = useDragControls()
  const setExercise = (id: number, patch: Partial<EditorExercise>) =>
    onChange({ ...complex, exercises: complex.exercises.map(e => (e.id === id ? { ...e, ...patch } : e)) })

  return (
    <Reorder.Item
      value={complex}
      dragListener={false}
      dragControls={drag}
      className={cn('bg-background border-[1.5px]', isNext ? 'border-primary' : 'border-foreground/80')}
      whileDrag={{ scale: 1.02, boxShadow: '6px 6px 0 var(--sb-blue)' }}
    >
      <div className='grid grid-cols-[auto_auto_1fr_auto] items-center gap-2 p-2 pr-3'>
        <button
          type='button'
          className='text-foreground/50 flex size-10 touch-none items-center justify-center'
          onPointerDown={e => drag.start(e)}
          aria-label={`Перетащить тренировку «${complex.title}»`}
        >
          <GripVerticalIcon className='size-5' />
        </button>
        <Poster
          as='span'
          size='xl'
          tone={isNext ? 'primary' : 'faint'}
          className='w-8'
        >
          {LETTERS[index]}
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
            {complex.title}
          </Text>
          <Text
            as='span'
            size='xs'
            tone='muted'
            className='mt-0.5 flex items-center gap-2'
          >
            {pluralize(complex.exercises.length, EXERCISE_FORMS)}
            {isNext && <Badge className='h-5'>следующая</Badge>}
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
              <Label htmlFor={`complex-${complex.id}`}>Название тренировки</Label>
              <Input
                id={`complex-${complex.id}`}
                value={complex.title}
                onChange={e => onChange({ ...complex, title: e.target.value })}
              />
              {complex.exercises.length > 0 && (
                <List>
                  {complex.exercises.map((e, i) => (
                    <ListRow
                      key={e.id}
                      lead={i + 1}
                      title={e.name}
                      meta={e.muscles}
                      trail={
                        <Button
                          variant='outline'
                          size='icon-sm'
                          aria-label={`Убрать «${e.name}»`}
                          onClick={() =>
                            onChange({ ...complex, exercises: complex.exercises.filter(x => x.id !== e.id) })
                          }
                        >
                          <XIcon />
                        </Button>
                      }
                    >
                      {e.draft && (
                        <Badge
                          variant='outline'
                          className='mt-2'
                        >
                          не проверено
                        </Badge>
                      )}
                      {/* Подходы и диапазон повторов: «3 × 8–12» */}
                      <div className='mt-2 flex items-center gap-2'>
                        <Input
                          value={e.sets}
                          inputMode='numeric'
                          onChange={ev => setExercise(e.id, { sets: Number(ev.target.value.replace(/\D/g, '')) || 0 })}
                          className='sb-poster h-9 w-12 px-1 text-center text-[20px]'
                          aria-label='Подходов'
                        />
                        <Poster
                          as='span'
                          size='sm'
                        >
                          ×
                        </Poster>
                        <Input
                          value={e.reps}
                          onChange={ev => setExercise(e.id, { reps: ev.target.value })}
                          className='sb-poster h-9 w-[84px] px-1 text-center text-[20px]'
                          aria-label='Повторов'
                        />
                      </div>
                    </ListRow>
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
                  title={`Удалить «${complex.title}»?`}
                  description='Тренировка пропадёт из очереди. История по ней сохранится.'
                  confirmLabel='Удалить'
                  onConfirm={onDelete}
                >
                  <Trash2Icon />
                  Удалить тренировку
                </ConfirmAction>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
}
