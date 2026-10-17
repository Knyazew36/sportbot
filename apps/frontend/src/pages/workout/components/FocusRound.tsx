import { CheckIcon, PauseIcon, PlayIcon, TimerResetIcon, XIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { type SupersetRound, supersetLabels } from '@/entities/workout'
import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer'
import type { useStopwatch } from '@/shared/lib/hooks/use-stopwatch'
import { cn } from '@/shared/lib/utils'
import { haptic } from '@/shared/miniapp'
import { Digits, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { FocusShell } from './FocusShell'

type FocusRoundProps = {
  stopwatch: ReturnType<typeof useStopwatch>
  round: SupersetRound
  startedAt: string
  /** Меняется в момент «Закончил круг» — список круга вспыхивает */
  burstKey?: number
  onFinish: () => void
  onRestart: () => void
  onCancel: () => void
}

const repsText = (min: number, max: number) => `${min === max ? min : `${min}–${max}`} повт.`

// Круг суперсета на весь экран: упражнения идут подряд без телефона в руках, поэтому круг виден целиком,
// а нажатие одно — в конце. Ввод — одной шторкой после круга
export const FocusRound = ({ stopwatch, round, startedAt, burstKey, onFinish, onRestart, onCancel }: FocusRoundProps) => {
  const still = useReducedMotion()
  const labels = supersetLabels(round.members)
  const label = (id: number) => labels[round.members.findIndex(e => e.id === id)]!

  const togglePause = () => {
    haptic.tap()
    if (stopwatch.paused) stopwatch.resume()
    else stopwatch.pause()
  }

  return (
    <FocusShell
      running={!stopwatch.paused}
      startedAt={startedAt}
      sets={{ number: round.number, done: round.number - 1, planned: round.rounds, unit: 'круг' }}
      actions={
        <>
          <Button
            variant='success'
            size='xl'
            className='w-full'
            onClick={onFinish}
          >
            <CheckIcon
              className='size-7'
              strokeWidth={3}
            />
            Закончил круг
          </Button>
          <div className='grid grid-cols-3 gap-3'>
            <Button
              variant={stopwatch.paused ? 'default' : 'outline'}
              onClick={togglePause}
              aria-label={stopwatch.paused ? 'Продолжить круг' : 'Поставить круг на паузу'}
            >
              {stopwatch.paused ? (
                <PlayIcon
                  className='size-5'
                  fill='currentColor'
                />
              ) : (
                <PauseIcon
                  className='size-5'
                  fill='currentColor'
                />
              )}
              {stopwatch.paused ? 'Дальше' : 'Пауза'}
            </Button>
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
              Отмена
            </Button>
          </div>
        </>
      }
    >
      <Poster
        size='hero'
        numeric
        className={cn('text-[min(110px,26vw)]', stopwatch.paused && 'opacity-50')}
      >
        <Digits>{formatSeconds(stopwatch.elapsed)}</Digits>
      </Poster>
      {/* На паузе гасим всё, кроме кнопки «дальше» посередине — как у обычного подхода: взгляд сразу на ней,
          а случайный тап по тёмному не жмёт «Закончил круг» или «Отмена» */}
      <div
        aria-hidden
        className={cn(
          'bg-background/85 fixed inset-0 z-10 transition-opacity duration-200',
          stopwatch.paused ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <AnimatePresence>
        {stopwatch.paused && (
          <motion.div
            className='pointer-events-none fixed inset-0 z-20 flex items-center justify-center'
            initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <button
              type='button'
              onClick={togglePause}
              aria-label='Продолжить круг'
              className='bg-primary text-primary-foreground focus-visible:ring-ring/25 pointer-events-auto flex size-[min(140px,20svh)] flex-col items-center justify-center rounded-full outline-none transition-[scale] duration-100 focus-visible:ring-4 active:scale-95'
            >
              <PlayIcon
                className='size-7'
                fill='currentColor'
              />
              <Poster
                as='span'
                size='xs'
                tone='inherit'
                className='mt-1.5'
              >
                дальше
              </Poster>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Весь круг списком: взгляд на экран между упражнениями — и видно, что дальше и сколько повторов */}
      <motion.ol
        key={burstKey}
        className='border-border divide-border w-full divide-y-[1.5px] border-[1.5px]'
        // Вспышка круга: короткий удар яркостью и масштабом, без неё закрытие круга теряется
        initial={still || burstKey === undefined ? false : { scale: 1.04, filter: 'brightness(1.6)' }}
        animate={{ scale: 1, filter: 'brightness(1)' }}
        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
      >
        {round.round.map(e => (
          <li
            key={e.id}
            className='flex items-center gap-3 px-3 py-2.5'
          >
            <Poster
              as='span'
              size='xs'
              tone='primary'
              className='w-7 shrink-0'
            >
              {label(e.id)}
            </Poster>
            <Text
              as='span'
              size='md'
              className='min-w-0 flex-1 truncate'
            >
              {e.name}
            </Text>
            <Poster
              as='span'
              size='xs'
              numeric
              className='shrink-0'
            >
              {repsText(e.repsMin, e.repsMax)}
            </Poster>
          </li>
        ))}
      </motion.ol>
    </FocusShell>
  )
}
