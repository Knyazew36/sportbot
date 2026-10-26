import { CheckIcon, PauseIcon, PlayIcon, TimerResetIcon, XIcon } from 'lucide-react'

import { useEffect, useRef } from 'react'

import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer'
import { type Measure, rangeText } from '@sportbot/api/lib/measure'
import type { useStopwatch } from '@/shared/lib/hooks/use-stopwatch'
import { cn } from '@/shared/lib/utils'
import { haptic } from '@/shared/miniapp'
import { Ring } from '@/shared/ui/kit/Ring'
import { Digits, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { FocusShell } from './FocusShell'

type FocusSetProps = {
  stopwatch: ReturnType<typeof useStopwatch>
  title: string
  startedAt: string
  setNumber: number
  plannedSets: number
  /** Подход закончен — открыть ввод веса и повторов */
  onDone: () => void
  /** Упражнение на время: план в секундах. Нижняя граница — сигнал «цель есть» */
  target?: { min: number; max: number; measure: Measure }
  /** Сигнал, когда время дошло до нижней границы цели: звук и вибрация из настроек */
  onTarget?: () => void
}

// Идёт подход: секундомер на весь экран. Пауза — если отвлекли посреди подхода, её время в подход не идёт
export const FocusSet = ({
  stopwatch,
  title,
  startedAt,
  setNumber,
  plannedSets,
  onDone,
  target,
  onTarget,
}: FocusSetProps) => {
  // Сигнал один раз за подход: «Сначала» обнуляет секундомер — сигнал снова ждёт цели
  const signalled = useRef(false)
  const reached = !!target && stopwatch.elapsed >= target.min
  useEffect(() => {
    if (!target) return
    if (!reached) {
      signalled.current = false
      return
    }
    if (signalled.current) return
    signalled.current = true
    onTarget?.()
  }, [reached, target, onTarget])

  return (
  <FocusShell
    title={title}
    startedAt={startedAt}
    sets={{ number: setNumber, done: setNumber - 1, planned: plannedSets }}
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
    {target && (
      <Text
        size='sm'
        tone={reached ? 'primary' : 'muted'}
      >
        {reached ? 'цель есть' : 'цель'} · {rangeText(target.measure, target.min, target.max)}
      </Text>
    )}
    {/* На паузе гасим всё, кроме кнопки «дальше»: взгляд сразу на ней, а случайный тап по тёмному не жмёт «Закончил» или «Отменить» */}
    <div
      aria-hidden
      className={cn(
        'bg-background/85 fixed inset-0 z-10 transition-opacity duration-200',
        stopwatch.paused ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    />
    {/* Кольцо делает оборот за минуту — как секундная стрелка; в центре пауза, палец и взгляд в одной точке */}
    <div className='relative z-20'>
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
        onClick={() => {
          haptic.tap()
          if (stopwatch.paused) stopwatch.resume()
          else stopwatch.pause()
        }}
        aria-label={stopwatch.paused ? 'Продолжить подход' : 'Поставить подход на паузу'}
        className={cn(
          'focus-visible:ring-ring/25 absolute inset-[14%] flex flex-col items-center justify-center rounded-full outline-none transition-[scale,background-color] duration-100 focus-visible:ring-4 active:scale-95',
          stopwatch.paused ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background',
        )}
      >
        {/* Залитая иконка и плакатная подпись: на плотном круге тонкий капс терялся */}
        {stopwatch.paused ? (
          <PlayIcon
            className='size-7'
            fill='currentColor'
          />
        ) : (
          <PauseIcon
            className='size-7'
            fill='currentColor'
          />
        )}
        <Poster
          as='span'
          size='xs'
          tone='inherit'
          className='mt-1.5'
        >
          {stopwatch.paused ? 'дальше' : 'пауза'}
        </Poster>
      </button>
    </div>
  </FocusShell>
  )
}
