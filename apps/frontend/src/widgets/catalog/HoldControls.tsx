import type { LucideIcon } from 'lucide-react'

import { useEffect, useRef, useState } from 'react'

import { useCountdown } from '@/shared/lib/hooks/use-countdown'
import { StickyFooter } from '@/shared/ui/kit/Screen'
import { TimerButton } from '@/shared/ui/kit/TimerButton'
import { Eyebrow, Lead } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type SideAction = { label: string; icon: LucideIcon; onClick: () => void }

type HoldControlsProps = {
  holdSeconds: number
  /** Для растяжки «на каждую сторону» — какая сторона сейчас; иначе подпись стороны не показывается */
  side?: 1 | 2
  back: SideAction
  next: SideAction
  /** Время удержания вышло — один раз: звук и вибрация. Дальше человек переходит сам */
  onEnd?: () => void
  /** Отсчёт сразу, без нажатия: «Попробовать» в карточке растяжки — человек уже нажал старт */
  autoStart?: boolean
}

// Низ экрана удержания растяжки: таймер вокруг кнопки паузы и два перехода по бокам.
// Общий для заминки и «Попробовать» в карточке растяжки. Отсчёт перезапускается сменой key снаружи.
// В заминке отсчёт ждёт нажатия: сначала прочитать, как встать, и только потом держать
export const HoldControls = ({ holdSeconds, side, back, next, onEnd, autoStart = false }: HoldControlsProps) => {
  const [started, setStarted] = useState(autoStart)
  const [paused, setPaused] = useState(!autoStart)
  const [left] = useCountdown(holdSeconds, { paused })
  const over = left <= 0
  const endedRef = useRef(false)

  useEffect(() => {
    if (!over || endedRef.current) return
    endedRef.current = true
    onEnd?.()
  }, [over, onEnd])

  return (
    <StickyFooter className='block pt-3'>
      <div className='flex items-baseline justify-center gap-2'>
        <Eyebrow tone={over || !started ? 'primary' : 'muted'}>
          {over ? 'готово' : !started ? 'жми старт' : paused ? 'пауза' : 'держи'}
        </Eyebrow>
        {side && (
          <Lead
            as='span'
            size='sm'
            tone='primary'
          >
            {side === 1 ? 'правая сторона' : 'левая сторона'}
          </Lead>
        )}
      </div>
      <div className='mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3'>
        {/* Иконка над подписью: в одну строку кнопки не помещались по бокам от таймера на 320px */}
        <Button
          variant='outline'
          size='sm'
          onClick={back.onClick}
          className='h-14 flex-col gap-0.5 justify-self-start px-3 text-[12px]'
        >
          <back.icon />
          {back.label}
        </Button>
        <TimerButton
          left={left}
          total={holdSeconds}
          paused={paused}
          onToggle={() => {
            setStarted(true)
            setPaused(p => !p)
          }}
        />
        {/* Когда время вышло, переход дальше становится главным действием */}
        <Button
          variant={over ? 'default' : 'outline'}
          size='sm'
          onClick={next.onClick}
          className='h-14 flex-col gap-0.5 justify-self-end px-3 text-[12px]'
        >
          <next.icon />
          {next.label}
        </Button>
      </div>
    </StickyFooter>
  )
}
