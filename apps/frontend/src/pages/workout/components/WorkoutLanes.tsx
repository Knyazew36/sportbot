import { CheckIcon } from 'lucide-react'

import type { WorkoutItem } from '@/entities/workout'
import { cn } from '@/shared/lib/utils'
import { Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type WorkoutLanesProps = {
  items: WorkoutItem[]
  currentId: number
  onPick: (id: number) => void
}

// Упражнения как беговые дорожки: сделано залито, текущее в синем контуре. Порядок не обязателен (frontend-tz, 8.1)
export const WorkoutLanes = ({ items, currentId, onPick }: WorkoutLanesProps) => (
  <ol
    className='grid gap-1.5 px-5 pt-4'
    style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 8)}, minmax(0, 1fr))` }}
  >
    {items.map((item, i) => {
      const isCurrent = item.id === currentId
      return (
        <li key={item.id}>
          <Button
            variant={item.done ? 'default' : isCurrent ? 'alert' : 'outline'}
            size='sm'
            onClick={() => onPick(item.id)}
            className={cn(
              'h-11 w-full items-end justify-between px-1.5 pb-1',
              isCurrent && 'border-2',
              !item.done && !isCurrent && 'text-foreground/45',
            )}
            aria-label={`${item.name}${item.done ? ', сделано' : ''}`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <Poster
              as='span'
              size='xs'
            >
              {i + 1}
            </Poster>
            {item.done && (
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
