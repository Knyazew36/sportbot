import { CheckIcon } from 'lucide-react'

import { supersetLabels, type WorkoutItem } from '@/entities/workout'
import { cn } from '@/shared/lib/utils'
import { Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type WorkoutLanesProps = {
  items: WorkoutItem[]
  currentId: number
  onPick: (id: number) => void
}

// Участник суперсета: «A1», а над дорожками группы — общая планка через промежутки
const laneLabel = (items: WorkoutItem[], i: number) => {
  const item = items[i]!
  if (item.superset === null) return { label: String(i + 1), joinLeft: false, joinRight: false }
  return {
    label: supersetLabels(items)[i]!,
    joinLeft: items[i - 1]?.superset === item.superset,
    joinRight: items[i + 1]?.superset === item.superset,
  }
}

// Упражнения как беговые дорожки: сделано залито, текущее в синем контуре. Порядок не обязателен (frontend-tz, 8.1)
export const WorkoutLanes = ({ items, currentId, onPick }: WorkoutLanesProps) => (
  <ol
    className='grid gap-1.5 px-gutter pt-4'
    style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 8)}, minmax(0, 1fr))` }}
  >
    {items.map((item, i) => {
      const isCurrent = item.id === currentId
      const lane = laneLabel(items, i)
      return (
        <li
          key={item.id}
          className='relative'
        >
          {item.superset !== null && (
            <span
              aria-hidden
              className={cn(
                'bg-primary absolute -top-2 h-[3px]',
                lane.joinLeft ? '-left-[3px]' : 'left-0',
                lane.joinRight ? '-right-[3px]' : 'right-0',
              )}
            />
          )}
          <Button
            variant={item.done ? 'default' : isCurrent ? 'alert' : 'outline'}
            size='sm'
            onClick={() => onPick(item.id)}
            className={cn(
              'h-11 w-full items-end justify-between px-1.5 pb-1',
              isCurrent && 'border-2',
              !item.done && !isCurrent && 'text-foreground/45',
            )}
            aria-label={`${item.name}${item.superset !== null ? `, суперсет ${lane.label}` : ''}${item.done ? ', сделано' : ''}`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <Poster
              as='span'
              size='xs'
            >
              {lane.label}
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
