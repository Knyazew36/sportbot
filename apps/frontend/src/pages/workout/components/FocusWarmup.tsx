import { ArrowRightIcon, PlusIcon } from 'lucide-react'

import { formatSeconds, type useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer'
import { cn } from '@/shared/lib/utils'
import { Ring } from '@/shared/ui/kit/Ring'
import { Digits, Eyebrow, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { FocusShell } from './FocusShell'
import { TimeBumps, useTimeBumps } from './TimeBumps'

type FocusWarmupProps = {
  timer: ReturnType<typeof useDeadlineTimer>
  /** К экрану упражнения: разминка сворачивается, отсчёт идёт и виден на кнопке в футере */
  onClose: () => void
}

// Разминка перед первым упражнением: обратный отсчёт на весь экран, как отдых, но коралловый — экраны похожи,
// и цвет сразу говорит, какой из них открыт. Сама не закрывается — по окончании ждёт «К упражнениям».
// Подход отсюда не начинается: сначала экран упражнения
export const FocusWarmup = ({ timer, onClose }: FocusWarmupProps) => {
  const over = timer.status === 'running' && timer.left <= 0
  const bumps = useTimeBumps()
  const addMinute = () => {
    timer.add(60)
    bumps.bump()
  }
  return (
    <FocusShell
      actions={
        <>
          <Button
            variant={over ? 'success' : 'warmup'}
            size='xl'
            className='h-24 w-full'
            onClick={onClose}
          >
            К упражнениям
            <ArrowRightIcon
              className='size-7'
              strokeWidth={2.5}
            />
          </Button>
          <Button
            variant='outline'
            disabled={over}
            onClick={addMinute}
          >
            <PlusIcon strokeWidth={3} />1 мин
          </Button>
        </>
      }
    >
      {/* Заголовок по центру над кольцом, как «Отдых»: высота постоянная, кольцо не прыгает */}
      <div className='flex h-[min(72px,16vw)] w-full items-center'>
        <Poster
          as='h2'
          size='4xl'
          tone={over ? 'muted' : 'inherit'}
          fit
          className={cn('w-full text-center', !over && 'text-(--sb-warmup-ink)')}
        >
          {over ? 'Разминка окончена' : 'Разминка'}
        </Poster>
      </div>
      <div className='relative flex items-center justify-center'>
        <Ring
          value={timer.fraction}
          transitionMs={250}
          size={300}
          stroke={6}
          bar='var(--sb-warmup-ink)'
          track='color-mix(in oklab, var(--foreground) 14%, transparent)'
          className='h-auto w-[min(300px,80vw,36svh)]'
        />
        <div className='absolute inset-0 flex flex-col items-center justify-center'>
          {over ? (
            <Poster size='4xl'>Вперёд</Poster>
          ) : (
            // Подпись под цифрами вне потока, чтобы цифры стояли ровно по центру кольца
            <div className='relative'>
              <TimeBumps
                {...bumps}
                label='+1 мин'
                className='text-(--sb-warmup-ink)'
              />
              <Poster
                size='hero'
                numeric
                className='text-[min(96px,22vw,12svh)]'
              >
                <Digits>{formatSeconds(timer.left)}</Digits>
              </Poster>
              <Eyebrow className='absolute top-full left-1/2 -translate-x-1/2 whitespace-nowrap tabular-nums'>
                из {formatSeconds(timer.total)}
              </Eyebrow>
            </div>
          )}
        </div>
      </div>
    </FocusShell>
  )
}
