import { ArrowRightIcon, PlayIcon, PlusIcon } from 'lucide-react'

import { formatSeconds, type useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer'
import { Ring } from '@/shared/ui/kit/Ring'
import { Digits, Eyebrow, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { FocusShell } from './FocusShell'
import { NEXT_LABEL, type NextMode } from './WorkoutActions'

type FocusRestProps = {
  timer: ReturnType<typeof useDeadlineTimer>
  title: string
  nextSet: number
  /** Отдых закончен или пропущен — сразу следующий подход */
  onToSet: () => void
  /** Подходов больше не будет — к экрану упражнения */
  onClose: () => void
  /** План по подходам выполнен — главная кнопка ведёт дальше, а не в лишний подход */
  planDone: boolean
  next: NextMode | null
  onNext: () => void
}

// Отдых между подходами (frontend-tz, 8.3): обратный отсчёт на весь экран, «+30 с», «К подходу»
export const FocusRest = ({ timer, title, nextSet, onToSet, onClose, planDone, next, onNext }: FocusRestProps) => {
  const over = timer.left <= 0
  return (
    <FocusShell
      title={title}
      caption={over ? 'отдых закончился' : planDone ? 'отдых · план выполнен' : `отдых · до подхода ${nextSet}`}
      actions={
        <>
          {planDone ? (
            <Button
              variant={next === 'finish' ? 'success' : 'default'}
              size='xl'
              className='h-24 w-full'
              onClick={next ? onNext : onClose}
            >
              {/* Длинная подпись в две строки: высота h-24 под это и рассчитана */}
              <span className='text-balance whitespace-normal'>{next ? NEXT_LABEL[next] : 'К упражнению'}</span>
              <ArrowRightIcon
                className='size-7'
                strokeWidth={2.5}
              />
            </Button>
          ) : (
            <Button
              variant={over ? 'success' : 'default'}
              size='xl'
              className='h-24 w-full'
              onClick={onToSet}
            >
              <PlayIcon className='size-7' />
              {over ? 'Начать подход' : 'К подходу'}
            </Button>
          )}
          <div className='grid grid-cols-2 gap-3'>
            <Button
              variant='outline'
              disabled={over}
              onClick={() => timer.add(30)}
            >
              <PlusIcon strokeWidth={3} />
              30 с
            </Button>
            {planDone ? (
              <Button
                variant='outline'
                onClick={onToSet}
              >
                <PlusIcon strokeWidth={3} />
                Ещё подход
              </Button>
            ) : (
              <Button
                variant='outline'
                onClick={onClose}
              >
                К упражнению
              </Button>
            )}
          </div>
        </>
      }
    >
      {/* Заголовок не пропадает по окончании: иначе кольцо прыгает вверх */}
      <Poster
        as='h2'
        size='4xl'
        tone={over ? 'muted' : 'primary'}
        fit
        className='w-full text-center'
      >
        {over ? 'Отдых окончен' : 'Отдых'}
      </Poster>
      <div className='relative flex items-center justify-center'>
        <Ring
          value={timer.fraction}
          transitionMs={250}
          size={300}
          stroke={6}
          track='color-mix(in oklab, var(--foreground) 14%, transparent)'
          className='h-auto w-[min(300px,80vw,36svh)]'
        />
        <div className='absolute inset-0 flex flex-col items-center justify-center'>
          {over ? (
            <Poster size='4xl'>Вперёд</Poster>
          ) : (
            <Poster
              size='hero'
              numeric
              className='text-[min(96px,22vw,12svh)]'
            >
              <Digits>{formatSeconds(timer.left)}</Digits>
            </Poster>
          )}
          {over && -timer.left > 1 && (
            <Eyebrow className='mt-2'>
              {-timer.left} с назад
            </Eyebrow>
          )}
        </div>
      </div>
    </FocusShell>
  )
}
