import { PlayIcon, TimerIcon, TimerResetIcon } from 'lucide-react'

import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer'
import type { useStopwatch } from '@/shared/lib/hooks/use-stopwatch'
import { cn } from '@/shared/lib/utils'
import { Ring } from '@/shared/ui/kit/Ring'
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type SetTimerProps = {
  stopwatch: ReturnType<typeof useStopwatch>
  setNumber: number
  /** Отдых между подходами; null — таймер отдыха выключен в профиле */
  restSeconds: number | null
  onRest: () => void
}

// Секундомер подхода: идёт от «Начать подход» до «Далее». Пока идёт отдых, на его месте таймер отдыха
export const SetTimer = ({ stopwatch, setNumber, restSeconds, onRest }: SetTimerProps) => {
  const restButton = restSeconds !== null && (
    <Button
      variant='paper'
      className='justify-between'
      onClick={onRest}
    >
      <span className='flex items-center gap-2'>
        <TimerIcon className='size-5' />
        Отдых
      </span>
      <span className='tabular-nums'>{formatSeconds(restSeconds)}</span>
    </Button>
  )

  if (!stopwatch.running)
    return (
      <div className={cn('grid gap-3 px-gutter pt-4', restButton && 'grid-cols-2')}>
        <Button
          variant='paper'
          onClick={stopwatch.start}
        >
          <PlayIcon className='size-5' />
          Начать подход
        </Button>
        {restButton}
      </div>
    )

  return (
    <>
      <div className='flex items-center gap-4 px-gutter pt-4'>
        <div className='relative shrink-0'>
          {/* Кольцо делает оборот за минуту — как секундная стрелка */}
          <Ring
            value={(stopwatch.elapsed % 60) / 60}
            size={132}
            stroke={5}
            track='color-mix(in oklab, var(--sb-paper) 22%, transparent)'
            className='h-auto w-[min(132px,18svh)]'
          />
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <PlayIcon className='text-primary size-4' />
            <Eyebrow
              size='sm'
              tone='inverseMuted'
              className='mt-1'
            >
              подход
            </Eyebrow>
          </div>
        </div>
        <div className='min-w-0 flex-1'>
          <Eyebrow
            as='p'
            tone='inverseMuted'
          >
            идёт подход {setNumber}
          </Eyebrow>
          <Poster
            size='5xl'
            numeric
            className='mt-1 text-[min(76px,11svh,17vw)]'
          >
            {formatSeconds(stopwatch.elapsed)}
          </Poster>
        </div>
      </div>
      <div className={cn('grid gap-3 px-gutter pt-4', restButton && 'grid-cols-2')}>
        <Button
          variant='paper'
          onClick={stopwatch.start}
        >
          <TimerResetIcon className='size-5' />
          Заново
        </Button>
        {restButton}
      </div>
    </>
  )
}
