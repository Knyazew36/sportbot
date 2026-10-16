import { ArrowRightIcon, CheckIcon, PauseIcon, PlayIcon, TimerResetIcon, XIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { type SupersetRound, supersetLabels } from '@/entities/workout'
import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer'
import type { useStopwatch } from '@/shared/lib/hooks/use-stopwatch'
import { cn } from '@/shared/lib/utils'
import { haptic } from '@/shared/miniapp'
import { ChargeChain } from '@/shared/ui/kit/ChargeChain'
import { Ring } from '@/shared/ui/kit/Ring'
import { Digits, Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { FocusShell } from './FocusShell'

type FocusRoundProps = {
  stopwatch: ReturnType<typeof useStopwatch>
  round: SupersetRound
  /** Шаг круга: индекс упражнения в round.round */
  step: number
  startedAt: string
  /** Меняется в момент «Закончил круг» — цепочка вспыхивает */
  burstKey?: number
  onNext: () => void
  onFinish: () => void
  onRestart: () => void
  onCancel: () => void
}

const repsText = (min: number, max: number) => `${min === max ? min : `${min}–${max}`} повт.`

// Круг суперсета на весь экран: один секундомер на круг, упражнения сменяют друг друга без ввода и без отдыха.
// Ввод — одной шторкой в конце круга
export const FocusRound = ({
  stopwatch,
  round,
  step,
  startedAt,
  burstKey,
  onNext,
  onFinish,
  onRestart,
  onCancel,
}: FocusRoundProps) => {
  const still = useReducedMotion()
  const labels = supersetLabels(round.members)
  const label = (id: number) => labels[round.members.findIndex(e => e.id === id)]!
  const current = round.round[step]!
  const next = round.round[step + 1]
  const last = !next

  return (
    <FocusShell
      running={!stopwatch.paused}
      status={stopwatch.paused ? 'пауза — время круга стоит' : `суперсет ${round.letter} · без отдыха`}
      alert={stopwatch.paused}
      above={
        <ChargeChain
          burstKey={burstKey}
          links={round.round.map((e, i) => ({
            label: label(e.id),
            // Пройденное звено заряжено целиком, текущее — наполовину: заряд перетекает по «Дальше»
            charge: i < step ? 1 : i === step ? 0.5 : 0,
            state: i < step ? 'done' : i === step ? 'current' : 'idle',
          }))}
        />
      }
      title={
        <AnimatePresence
          mode='popLayout'
          initial={false}
        >
          <motion.span
            key={current.id}
            className='block'
            initial={still ? { opacity: 0 } : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={still ? { opacity: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {label(current.id)} · {current.name}
          </motion.span>
        </AnimatePresence>
      }
      // Что будет после этого упражнения: следующее в круге с его планом или конец круга
      subtitle={
        <Text
          size='md'
          className='mt-2 flex items-baseline gap-2'
        >
          <Eyebrow tone='primary'>далее</Eyebrow>
          <span className='min-w-0 truncate'>
            {next
              ? `${label(next.id)} · ${next.name} · ${repsText(next.repsMin, next.repsMax)}`
              : 'запись круга и отдых'}
          </span>
        </Text>
      }
      startedAt={startedAt}
      sets={{ number: round.number, done: round.number - 1, planned: round.rounds, unit: 'круг' }}
      actions={
        <>
          <Button
            variant={last ? 'success' : 'default'}
            size='xl'
            className='h-24 w-full'
            onClick={last ? onFinish : onNext}
          >
            {last ? (
              <CheckIcon
                className='size-8'
                strokeWidth={3}
              />
            ) : null}
            {/* Длинное название в две строки: высота h-24 под это */}
            <span className='text-balance whitespace-normal'>{last ? 'Закончил круг' : `Дальше: ${next.name}`}</span>
            {!last && (
              <ArrowRightIcon
                className='size-7'
                strokeWidth={2.5}
              />
            )}
          </Button>
          <div className='grid grid-cols-2 gap-3'>
            <Button
              variant='outline'
              onClick={onRestart}
            >
              <TimerResetIcon className='size-5' />
              Сначала
            </Button>
            {/* Отмена сбрасывает весь круг: ввода ещё не было, записывать нечего */}
            <Button
              variant='outline'
              onClick={onCancel}
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
        className={cn('text-[min(130px,30vw)]', stopwatch.paused && 'opacity-50')}
      >
        <Digits>{formatSeconds(stopwatch.elapsed)}</Digits>
      </Poster>
      <AnimatePresence
        mode='popLayout'
        initial={false}
      >
        <motion.div
          key={current.id}
          initial={still ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className='flex flex-col items-center gap-1'
        >
          <Poster
            as='p'
            size='xl'
            tone='primary'
          >
            {repsText(current.repsMin, current.repsMax)}
          </Poster>
          <Text
            size='sm'
            tone='muted'
          >
            подход {current.sets.length + 1} из {current.plannedSets}
          </Text>
        </motion.div>
      </AnimatePresence>
      {/* Пауза — как у обычного подхода: кольцо оборачивается за минуту, в центре круглая кнопка под палец */}
      <div className='relative'>
        <Ring
          // Новая минута — новое кольцо: иначе переход с почти полного на пустое крутил бы его назад
          key={Math.floor(stopwatch.elapsedMs / 60_000)}
          value={(stopwatch.elapsedMs % 60_000) / 60_000}
          transitionMs={250}
          size={140}
          stroke={5}
          track='color-mix(in oklab, var(--foreground) 14%, transparent)'
          className='h-auto w-[min(120px,16svh)]'
        />
        <button
          type='button'
          onClick={() => {
            haptic.tap()
            if (stopwatch.paused) stopwatch.resume()
            else stopwatch.pause()
          }}
          aria-label={stopwatch.paused ? 'Продолжить круг' : 'Поставить круг на паузу'}
          className={cn(
            'focus-visible:ring-ring/25 absolute inset-[14%] flex flex-col items-center justify-center rounded-full outline-none transition-[scale,background-color] duration-100 focus-visible:ring-4 active:scale-95',
            stopwatch.paused ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background',
          )}
        >
          {stopwatch.paused ? (
            <PlayIcon
              className='size-6'
              fill='currentColor'
            />
          ) : (
            <PauseIcon
              className='size-6'
              fill='currentColor'
            />
          )}
          <Poster
            as='span'
            size='xs'
            tone='inherit'
            className='mt-1'
          >
            {stopwatch.paused ? 'дальше' : 'пауза'}
          </Poster>
        </button>
      </div>
    </FocusShell>
  )
}
