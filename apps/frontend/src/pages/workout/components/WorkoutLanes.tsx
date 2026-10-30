import { CheckIcon, PlusIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { supersetCharge, supersetLetter, toBlocks, type WorkoutItem } from '@sportbot/api/entities/workout'
import { ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type WorkoutLanesProps = {
  items: WorkoutItem[]
  currentId: number
  onPick: (id: number) => void
}

// Упражнения как беговые дорожки: сделано залито, текущее в синем контуре. Порядок не обязателен (frontend-tz, 8.1).
// Суперсет — одна дорожка с буквой: заливается по сделанным подходам всех участников.
// «+» стоит отдельно от дорожек и залит чернилами: это действие, а не ещё одно упражнение
export const WorkoutLanes = ({ items, currentId, onPick }: WorkoutLanesProps) => {
  const still = useReducedMotion()
  const blocks = toBlocks(items)
  let number = 0
  return (
    <div className='flex items-start gap-3 px-gutter pt-3'>
      <ol
        className='grid min-w-0 flex-1 gap-1'
        style={{ gridTemplateColumns: `repeat(${Math.min(blocks.length, 8)}, minmax(0, 1fr))` }}
      >
        {blocks.map(block => {
          const first = block.items[0]!
          const isCurrent = block.items.some(e => e.id === currentId)
          const charge = block.superset === null ? (first.done ? 1 : 0) : supersetCharge(block.items)
          const done = charge >= 1
          const label = block.superset === null ? String(++number) : supersetLetter(block.superset)
          const name = block.superset === null ? first.name : `суперсет ${label}: ${block.items.map(e => e.name).join(', ')}`
          return (
            <li key={block.key}>
              <Button
                variant={done ? 'default' : isCurrent ? 'alert' : 'outline'}
                size='sm'
                onClick={() => onPick(first.id)}
                className={cn(
                  'relative h-8 w-full justify-between overflow-hidden px-1.5',
                  isCurrent && 'border-2',
                  !done && !isCurrent && 'text-foreground/45',
                )}
                aria-label={`${name}${done ? ', сделано' : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Частичный заряд суперсета снизу дорожки: видно, сколько кругов уже позади */}
                {block.superset !== null && !done && (
                  <motion.span
                    aria-hidden
                    className='bg-primary absolute inset-x-0 bottom-0 h-1 origin-left'
                    initial={false}
                    animate={{ scaleX: charge }}
                    transition={still ? { duration: 0 } : { duration: 0.45 }}
                  />
                )}
                <Poster
                  as='span'
                  size='xs'
                >
                  {label}
                </Poster>
                {done && (
                  <CheckIcon
                    className='size-3'
                    strokeWidth={3}
                  />
                )}
              </Button>
            </li>
          )
        })}
      </ol>
      <ButtonLink
        to={ROUTES.WORKOUT_ADD}
        variant='ink'
        size='icon-xs'
        className='size-8 shrink-0'
        aria-label='Добавить упражнение'
      >
        <PlusIcon
          className='size-4'
          strokeWidth={3}
        />
      </ButtonLink>
    </div>
  )
}
