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
  startedAt: string
  nextSet: number
  plannedSets: number
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
export const FocusRest = ({ timer, title, startedAt, nextSet, plannedSets, onToSet, onClose, planDone, next, onNext }: FocusRestProps) => {
  const over = timer.left <= 0
  // total растёт с каждым «+30 с», поэтому прошедшее считаем от него: видно, сколько отдыхали всего, с добавками
  const rested = Math.max(0, timer.total - timer.left)
  return (
    <FocusShell
      title={title}
      startedAt={startedAt}
      status={over ? 'отдых закончился' : planDone ? 'отдых · план выполнен' : 'отдых · дальше подход'}
      alert={over}
      // План выполнен — на табло сделанное «3/3», а не несуществующий четвёртый подход
      sets={{ number: planDone ? nextSet - 1 : nextSet, done: nextSet - 1, planned: plannedSets }}
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
      {/* Заголовок не пропадает по окончании, а высота у него постоянная: «Отдых окончен» длиннее, fit ужимает кегль,
          и без рамки по высоте кольцо съезжало бы вверх */}
      <div className='flex h-[min(72px,16vw)] w-full items-center'>
        <Poster
          as='h2'
          size='4xl'
          tone={over ? 'muted' : 'primary'}
          fit
          className='w-full text-center'
        >
          {over ? 'Отдых окончен' : 'Отдых'}
        </Poster>
      </div>
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
            // Подпись «с назад» висит под словом, не в потоке: иначе её появление сдвигает «Вперёд» вверх
            <div className='relative'>
              <Poster size='4xl'>Вперёд</Poster>
              <Eyebrow className='absolute top-full left-1/2 mt-2 flex -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap tabular-nums'>
                <span>всего {formatSeconds(rested)}</span>
                {-timer.left > 1 && <span>{-timer.left} с назад</span>}
              </Eyebrow>
            </div>
          ) : (
            // Подпись под цифрами тоже вне потока, чтобы цифры стояли ровно по центру кольца
            <div className='relative'>
              <Poster
                size='hero'
                numeric
                className='text-[min(96px,22vw,12svh)]'
              >
                <Digits>{formatSeconds(timer.left)}</Digits>
              </Poster>
              <Eyebrow className='absolute top-full left-1/2 -translate-x-1/2 whitespace-nowrap tabular-nums'>
                {formatSeconds(rested)} из {formatSeconds(timer.total)}
              </Eyebrow>
            </div>
          )}
        </div>
      </div>
    </FocusShell>
  )
}
