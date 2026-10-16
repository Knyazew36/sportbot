import { CheckIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { supersetCharge, supersetLetter, toBlocks, type WorkoutItem } from '@/entities/workout'
import { cn } from '@/shared/lib/utils'
import { Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type WorkoutLanesProps = {
  items: WorkoutItem[]
  currentId: number
  onPick: (id: number) => void
}

// Упражнения как беговые дорожки: сделано залито, текущее в синем контуре. Порядок не обязателен (frontend-tz, 8.1).
// Суперсет — одна дорожка с буквой: заливается по сделанным подходам всех участников
export const WorkoutLanes = ({ items, currentId, onPick }: WorkoutLanesProps) => {
  const still = useReducedMotion()
  const blocks = toBlocks(items)
  let number = 0
  return (
    <ol
      className='grid gap-1.5 px-gutter pt-4'
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
                'relative h-11 w-full items-end justify-between overflow-hidden px-1.5 pb-1',
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
                  className='mb-0.5 size-3.5'
                  strokeWidth={3}
                />
              )}
            </Button>
          </li>
        )
      })}
    </ol>
  )
}
