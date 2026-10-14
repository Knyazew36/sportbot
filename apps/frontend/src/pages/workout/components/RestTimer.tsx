import { PlusIcon, TimerIcon } from 'lucide-react'

import { formatSeconds, type useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer'
import { Ring } from '@/shared/ui/kit/Ring'
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type RestTimerProps = {
  timer: ReturnType<typeof useDeadlineTimer>
  restSeconds: number
  nextSet: number
}

// Таймер отдыха (frontend-tz, 8.3): обратный отсчёт, «+30 с», «Пропустить». Без автостарта — кнопка «Отдых»
export const RestTimer = ({ timer, restSeconds, nextSet }: RestTimerProps) => {
  if (timer.status === 'idle')
    return (
      <div className='px-gutter pt-4'>
        <Button
          variant='paper'
          size='lg'
          className='w-full justify-between'
          onClick={() => timer.start(restSeconds)}
        >
          <span className='flex items-center gap-2'>
            <TimerIcon className='size-5' />
            Отдых
          </span>
          <span className='tabular-nums'>{formatSeconds(restSeconds)}</span>
        </Button>
      </div>
    )

  const over = timer.left <= 0
  return (
    <>
      <div className='flex items-center gap-4 px-gutter pt-4'>
        <div className='relative shrink-0'>
          <Ring
            value={timer.total ? Math.max(timer.left, 0) / timer.total : 0}
            size={132}
            stroke={5}
            track='color-mix(in oklab, var(--sb-paper) 22%, transparent)'
            className='h-auto w-[min(132px,18svh)]'
          />
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <TimerIcon className='text-primary size-4' />
            <Eyebrow
              size='sm'
              tone='inverseMuted'
              className='mt-1'
            >
              отдых
            </Eyebrow>
          </div>
        </div>
        <div className='min-w-0 flex-1'>
          {over ? (
            <>
              <Eyebrow
                as='p'
                tone='primary'
              >
                Отдых закончился {-timer.left > 1 ? `${-timer.left} с назад` : ''}
              </Eyebrow>
              <Poster
                size='2xl'
                className='mt-1'
              >
                Вперёд
              </Poster>
            </>
          ) : (
            <>
              <Eyebrow
                as='p'
                tone='inverseMuted'
              >
                до подхода {nextSet}
              </Eyebrow>
              <Poster
                size='5xl'
                numeric
                className='mt-1 text-[min(76px,11svh,17vw)]'
              >
                {formatSeconds(timer.left)}
              </Poster>
            </>
          )}
        </div>
      </div>
      <div className='grid grid-cols-2 gap-3 px-gutter pt-4'>
        <Button
          variant='paper'
          disabled={over}
          onClick={() => timer.add(30)}
        >
          <PlusIcon strokeWidth={3} />
          30 с
        </Button>
        <Button
          variant='paper'
          onClick={timer.stop}
        >
          {over ? 'Закрыть' : 'Пропустить'}
        </Button>
      </div>
    </>
  )
}
