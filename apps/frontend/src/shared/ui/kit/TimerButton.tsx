import { PauseIcon, PlayIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { haptic } from '@/shared/miniapp'

import { Ring } from './Ring'
import { Poster } from './Typography'

type TimerButtonProps = {
  /** Осталось секунд */
  left: number
  total: number
  paused: boolean
  onToggle: () => void
  className?: string
}

// Таймер удержания, совмещённый с управлением: кольцо отсчёта вокруг кнопки паузы, секунды — на самой кнопке.
// Палец и взгляд в одной точке внизу экрана, а верх остаётся под картинку и описание
export const TimerButton = ({ left, total, paused, onToggle, className }: TimerButtonProps) => {
  const seconds = Math.max(left, 0)
  return (
    <div className={cn('relative size-[124px] shrink-0', className)}>
      <Ring
        value={total > 0 ? seconds / total : 0}
        size={124}
        stroke={6}
        className='absolute inset-0'
      />
      <button
        type='button'
        onClick={() => {
          haptic.tap()
          onToggle()
        }}
        aria-label={paused ? `Продолжить, осталось ${seconds} секунд` : `Пауза, осталось ${seconds} секунд`}
        className={cn(
          'border-foreground focus-visible:ring-ring/25 absolute inset-[20px] flex flex-col items-center justify-center rounded-full border-[1.5px] shadow-[3px_3px_0_var(--sb-ink)] dark:shadow-none dark:active:translate-none transition-[translate,box-shadow,background-color] duration-100 outline-none focus-visible:ring-4 active:translate-[3px] active:shadow-none',
          paused ? 'bg-background text-foreground' : 'bg-primary text-primary-foreground',
        )}
      >
        <Poster
          as='span'
          size='xl'
          numeric
        >
          {seconds}
        </Poster>
        {paused ? <PlayIcon className='mt-0.5 size-4' /> : <PauseIcon className='mt-0.5 size-4' />}
      </button>
    </div>
  )
}
