import { PlayIcon, PlusIcon } from 'lucide-react'

import { formatSeconds, type useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer'
import { Ring } from '@/shared/ui/kit/Ring'
import { Digits, Eyebrow, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { FocusShell } from './FocusShell'

type FocusRestProps = {
  timer: ReturnType<typeof useDeadlineTimer>
  title: string
  nextSet: number
  /** Отдых закончен или пропущен — сразу следующий подход */
  onToSet: () => void
  /** Подходов больше не будет — к экрану упражнения, где «Следующее упражнение» */
  onClose: () => void
}

// Отдых между подходами (frontend-tz, 8.3): обратный отсчёт на весь экран, «+30 с», «К подходу»
export const FocusRest = ({ timer, title, nextSet, onToSet, onClose }: FocusRestProps) => {
  const over = timer.left <= 0
  return (
    <FocusShell
      title={title}
      caption={over ? 'отдых закончился' : `отдых · до подхода ${nextSet}`}
      actions={
        <>
          <Button
            variant={over ? 'success' : 'default'}
            size='xl'
            className='h-24 w-full'
            onClick={onToSet}
          >
            <PlayIcon className='size-7' />
            {over ? 'Начать подход' : 'К подходу'}
          </Button>
          <div className='grid grid-cols-2 gap-3'>
            <Button
              variant='outline'
              disabled={over}
              onClick={() => timer.add(30)}
            >
              <PlusIcon strokeWidth={3} />
              30 с
            </Button>
            <Button
              variant='outline'
              onClick={onClose}
            >
              К упражнению
            </Button>
          </div>
        </>
      }
    >
      <div className='relative flex items-center justify-center'>
        <Ring
          value={timer.total ? Math.max(timer.left, 0) / timer.total : 0}
          size={300}
          stroke={6}
          track='color-mix(in oklab, var(--foreground) 14%, transparent)'
          className='h-auto w-[min(300px,80vw,42svh)]'
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
