import { CheckIcon, PauseIcon, PlayIcon, TimerResetIcon, XIcon } from 'lucide-react'

import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer'
import type { useStopwatch } from '@/shared/lib/hooks/use-stopwatch'
import { cn } from '@/shared/lib/utils'
import { Ring } from '@/shared/ui/kit/Ring'
import { Digits, Eyebrow, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { FocusShell } from './FocusShell'
import { setCaption } from './set-caption'

type FocusSetProps = {
  stopwatch: ReturnType<typeof useStopwatch>
  title: string
  setNumber: number
  plannedSets: number
  /** Подход закончен — открыть ввод веса и повторов */
  onDone: () => void
}

// Идёт подход: секундомер на весь экран. Пауза — если отвлекли посреди подхода, её время в подход не идёт
export const FocusSet = ({ stopwatch, title, setNumber, plannedSets, onDone }: FocusSetProps) => (
  <FocusShell
    title={title}
    caption={`${stopwatch.paused ? 'пауза · ' : ''}${setCaption(setNumber, plannedSets)}`}
    actions={
      <>
        <Button
          variant='success'
          size='xl'
          className='h-24 w-full'
          onClick={onDone}
        >
          <CheckIcon
            className='size-8'
            strokeWidth={3}
          />
          Закончил подход
        </Button>
        <div className='grid grid-cols-2 gap-3'>
          <Button
            variant='outline'
            onClick={stopwatch.start}
          >
            <TimerResetIcon className='size-5' />
            Сначала
          </Button>
          {/* Запустил по ошибке — выйти, ничего не записывая */}
          <Button
            variant='outline'
            onClick={stopwatch.stop}
          >
            <XIcon className='size-5' />
            Отменить
          </Button>
        </div>
      </>
    }
  >
    <Poster
      size='hero'
      numeric
      className={cn('text-[min(150px,34vw)]', stopwatch.paused && 'opacity-50')}
    >
      <Digits>{formatSeconds(stopwatch.elapsed)}</Digits>
    </Poster>
    {/* Кольцо делает оборот за минуту — как секундная стрелка; в центре пауза, палец и взгляд в одной точке */}
    <div className='relative'>
      <Ring
        // Новая минута — новое кольцо: иначе переход с почти полного на пустое крутил бы его назад
        key={Math.floor(stopwatch.elapsedMs / 60_000)}
        value={(stopwatch.elapsedMs % 60_000) / 60_000}
        transitionMs={250}
        size={140}
        stroke={5}
        track='color-mix(in oklab, var(--foreground) 14%, transparent)'
        className='h-auto w-[min(140px,20svh)]'
      />
      <button
        type='button'
        onClick={stopwatch.paused ? stopwatch.resume : stopwatch.pause}
        aria-label={stopwatch.paused ? 'Продолжить подход' : 'Поставить подход на паузу'}
        className={cn(
          'focus-visible:ring-ring/25 absolute inset-[14%] flex flex-col items-center justify-center rounded-full outline-none transition-[scale,background-color] duration-100 focus-visible:ring-4 active:scale-95',
          stopwatch.paused ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background',
        )}
      >
        {stopwatch.paused ? <PlayIcon className='size-7' /> : <PauseIcon className='size-7' />}
        <Eyebrow
          size='sm'
          tone='inherit'
          className='mt-1'
        >
          {stopwatch.paused ? 'дальше' : 'пауза'}
        </Eyebrow>
      </button>
    </div>
  </FocusShell>
)
