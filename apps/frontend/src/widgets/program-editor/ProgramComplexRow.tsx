import { ChevronRightIcon, GripVerticalIcon } from 'lucide-react'
import { Reorder, useDragControls } from 'motion/react'
import { Link } from 'react-router'

import { complexLetter, type ProgramComplex } from '@/entities/program'
import { pluralize } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Badge } from '@/shared/ui/shadcn/badge'

type ProgramComplexRowProps = {
  complex: ProgramComplex
  index: number
  /** Страница комплекса */
  to: string
  /** Строку отпустили после перетаскивания — сохранить новый порядок */
  onDrop: () => void
}

// Комплекс в очереди программы: ручка для перетаскивания и переход на страницу комплекса
export const ProgramComplexRow = ({ complex, index, to, onDrop }: ProgramComplexRowProps) => {
  // Перетаскивание только за ручку: иначе прокрутка экрана пальцем хватала бы строки
  const drag = useDragControls()

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
        aria-label={`Перетащить комплекс «${complex.name}»`}
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
            {complex.exercises.length
              ? pluralize(complex.exercises.length, ['упражнение', 'упражнения', 'упражнений'])
              : 'пусто — добавь упражнения'}
            {complex.isNext && <Badge className='h-5'>следующий</Badge>}
          </Text>
        </span>
        <ChevronRightIcon className='text-foreground/60 size-5' />
      </Link>
    </Reorder.Item>
  )
}
