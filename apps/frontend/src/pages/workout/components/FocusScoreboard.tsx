import { cn } from '@/shared/lib/utils'
import { Digits, Eyebrow, Poster, Suffix } from '@/shared/ui/kit/Typography'

import { useWorkoutElapsed } from '@/shared/lib/hooks/use-workout-elapsed'
import { LiveDot } from '@/shared/ui/kit/LiveDot'

export type FocusSets = {
  /** Крупная цифра: идущий подход, следующий на отдыхе, а при выполненном плане — сделанные */
  number: number
  done: number
  planned: number
}

// Больше полос не влезает в половину табло на 375px — дальше хватает одной цифры
const MAX_PIPS = 8

// Сделанные — залитые полосы, текущий — контур акцентом. Полосы, а не точки: перекликаются с дорожками фона
const SetPips = ({ done, planned, number }: FocusSets) => (
  <span
    aria-hidden
    className='flex gap-1'
  >
    {Array.from({ length: planned }, (_, i) => (
      <span
        key={i}
        className={cn(
          'h-3 w-1.5 transition-colors duration-300',
          i < done ? 'bg-foreground' : i === number - 1 ? 'border-primary border-[1.5px]' : 'bg-foreground/15',
        )}
      />
    ))}
  </span>
)

// Табло шапки: подход и общее время на равных ячейках — оба читаются с вытянутой руки, взгляд не ищет мелкую подпись
export const FocusScoreboard = ({ sets, startedAt }: { sets: FocusSets; startedAt: string }) => {
  const elapsed = useWorkoutElapsed(startedAt)
  const over = sets.planned > 0 && sets.number > sets.planned
  return (
    <dl className='border-border grid grid-cols-2 divide-x-[1.5px] divide-border border-[1.5px]'>
      <div className='flex flex-col gap-2 p-3'>
        <dt className='flex h-3 items-center justify-between gap-2'>
          <Eyebrow tone={over ? 'primary' : 'muted'}>{over ? 'сверх плана' : 'подход'}</Eyebrow>
          {!over && sets.planned > 0 && sets.planned <= MAX_PIPS && <SetPips {...sets} />}
        </dt>
        <dd>
          <Poster
            size='xl'
            numeric
            tone={over ? 'primary' : 'inherit'}
            aria-label={sets.planned > 0 ? `подход ${sets.number} из ${sets.planned}` : `подход ${sets.number}`}
          >
            <Digits>{String(sets.number)}</Digits>
            {sets.planned > 0 && (
              <Suffix className='text-muted-foreground ml-0.5'>
                /<Digits>{String(sets.planned)}</Digits>
              </Suffix>
            )}
          </Poster>
        </dd>
      </div>
      <div
        role='timer'
        aria-label={`Время тренировки ${elapsed}`}
        className='flex flex-col gap-2 p-3'
      >
        <dt className='flex h-3 items-center gap-1.5'>
          <LiveDot />
          <Eyebrow>всего</Eyebrow>
        </dt>
        <dd>
          <Poster
            size='xl'
            numeric
          >
            <Digits>{elapsed}</Digits>
          </Poster>
        </dd>
      </div>
    </dl>
  )
}
