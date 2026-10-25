import { ChevronRightIcon, GripVerticalIcon } from 'lucide-react'
import { Reorder, useDragControls } from 'motion/react'
import { Link } from 'react-router'

import { complexLetter, type ProgramComplex } from '@sportbot/api/entities/program'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { cn } from '@/shared/lib/utils'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Badge } from '@/shared/ui/shadcn/badge'
import { EXERCISE_FORMS, SET_FORMS } from '@/shared/lib/plural-forms'

// Сколько упражнений показать в строке: больше — строка распухает, меньше — не видно, что это тренировка
const PREVIEW = 3

type ProgramComplexRowProps = {
  complex: ProgramComplex
  index: number
  /** Страница комплекса */
  to: string
  /** Строку отпустили после перетаскивания — сохранить новый порядок */
  onDrop: () => void
}

// Тренировка в очереди программы: ручка для перетаскивания и переход на её страницу.
// Первые упражнения видны прямо в строке — так понятно, что это целое занятие, а не папка
export const ProgramComplexRow = ({ complex, index, to, onDrop }: ProgramComplexRowProps) => {
  // Перетаскивание только за ручку: иначе прокрутка экрана пальцем хватала бы строки
  const drag = useDragControls()
  const names = complex.exercises.slice(0, PREVIEW).map(e => e.name)
  const more = complex.exercises.length - names.length
  const sets = complex.exercises.reduce((sum, e) => sum + e.sets, 0)

  return (
    <Reorder.Item
      value={complex.id}
      dragListener={false}
      dragControls={drag}
      onDragEnd={onDrop}
      className={cn(
        'bg-background grid grid-cols-[auto_1fr] items-center border-[1.5px]',
        complex.isNext ? 'border-primary' : 'border-foreground/80',
      )}
      whileDrag={{ scale: 1.02, boxShadow: '6px 6px 0 var(--sb-blue)' }}
    >
      <button
        type='button'
        className='text-foreground/50 flex h-full w-10 touch-none items-center justify-center'
        onPointerDown={e => drag.start(e)}
        aria-label={`Перетащить тренировку «${complex.name}»`}
      >
        <GripVerticalIcon className='size-5' />
      </button>
      <Link
        to={to}
        className='hover:bg-accent/60 grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3 py-3 pr-3 transition-colors'
      >
        <Poster
          as='span'
          size='xl'
          tone={complex.isNext ? 'primary' : 'faint'}
          className='w-7'
        >
          {complexLetter(index)}
        </Poster>
        <span className='min-w-0'>
          <span className='flex items-center gap-2'>
            <Text
              as='span'
              size='lg'
              className='min-w-0 truncate'
            >
              {complex.name}
            </Text>
            {complex.isNext && <Badge className='h-5 shrink-0'>следующая</Badge>}
          </span>
          {names.length > 0 ? (
            <>
              <Text
                as='span'
                size='sm'
                tone='soft'
                className='mt-1 line-clamp-2'
              >
                {names.join(' · ')}
                {more > 0 && ` · ещё ${more}`}
              </Text>
              <Text
                as='span'
                size='xs'
                tone='muted'
                className='mt-1 block'
              >
                {pluralize(complex.exercises.length, EXERCISE_FORMS)} · {pluralize(sets, SET_FORMS)}
              </Text>
            </>
          ) : (
            <Text
              as='span'
              size='xs'
              tone='muted'
              className='mt-0.5 block'
            >
              пусто — добавь упражнения
            </Text>
          )}
        </span>
        <ChevronRightIcon className='text-foreground/60 size-5' />
      </Link>
    </Reorder.Item>
  )
}
