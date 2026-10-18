import type { CompositionId, CompositionProps } from '@sportbot/render-contract'
import { previewOf } from '@sportbot/video/previews'
import { RotateCcwIcon } from 'lucide-react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type Props<Id extends CompositionId> = {
  compositionId: Id
  props: CompositionProps<Id>
  className?: string
}

// Шахматка — как в монтажке: видно, что фон у ролика прозрачный
const CHECKER =
  'repeating-conic-gradient(color-mix(in oklab, var(--sb-ink) 10%, transparent) 0 25%, transparent 0 50%) 0 0 / 20px 20px'

// Кривые — те же, что у плашки в ролике (motion.ease в @sportbot/brand)
const ENTER = [0.2, 0, 0, 1] as const
const EXIT = [0.4, 0, 1, 1] as const

/** 1,5 → «0:01,5» — как счётчик в монтажке */
const timecode = (seconds: number) => `0:${seconds.toFixed(1).padStart(4, '0').replace('.', ',')}`

/**
 * Превью ролика без плеера: та же вёрстка, что рендерит сервер, размеры — от ширины блока, как в
 * ролике — от ширины кадра. При открытии плашка выезжает и стоит — текст правится на виду.
 * «Повторить» проигрывает ролик целиком, с паузой и уездом, за его настоящую длительность —
 * полоса под кадром показывает, сколько прошло
 */
export const VideoPreview = <Id extends CompositionId>({ compositionId, props, className }: Props<Id>) => {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  // Номер прогона: новый ключ перезапускает анимацию с начала
  const [run, setRun] = useState(0)
  const [playing, setPlaying] = useState(false)
  const { component: Preview, seconds, enter, exit } = previewOf(compositionId, props)
  // Прошедшее время прогона, с: им двигается полоса и счётчик
  const elapsed = useMotionValue(0)
  const progress = useTransform(elapsed, t => t / seconds)
  const counter = useTransform(elapsed, timecode)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Как в ролике: за кадр — на всю ширину кадра, иначе короткая плашка с тенью выглядывает
  const hidden = -width

  const replay = () => {
    setRun(n => n + 1)
    setPlaying(true)
    elapsed.set(0)
    animate(elapsed, seconds, { duration: seconds, ease: 'linear' })
  }

  return (
    <div className='flex flex-col gap-2'>
      <div
        ref={ref}
        className={cn('border-foreground overflow-hidden border-[1.5px] px-[6%] py-8', className)}
        style={{ background: CHECKER }}
      >
        {width > 0 && (
          <motion.div
            key={run}
            className='w-fit max-w-full'
            initial={{ x: hidden }}
            animate={playing ? { x: [hidden, 0, 0, hidden] } : { x: 0 }}
            transition={
              playing
                ? { duration: seconds, times: [0, enter, exit, 1], ease: [ENTER, 'linear', EXIT] }
                : { duration: seconds * enter, ease: ENTER }
            }
            // Ролик кончился — плашка возвращается на место, чтобы текст снова было видно
            onAnimationComplete={() => {
              if (!playing) return
              setPlaying(false)
              setRun(n => n + 1)
            }}
          >
            <Preview
              props={props}
              unit={width}
            />
          </motion.div>
        )}
      </div>
      <div className='flex items-center gap-3'>
        <Button
          size='sm'
          variant='outline'
          disabled={playing}
          onClick={replay}
        >
          <RotateCcwIcon />
          Повторить
        </Button>
        <div className='border-foreground h-2 flex-1 overflow-hidden border-[1.5px]'>
          <motion.div
            className='bg-primary h-full origin-left'
            style={{ scaleX: progress }}
          />
        </div>
        <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
          <motion.span>{counter}</motion.span> / {timecode(seconds)}
        </span>
      </div>
    </div>
  )
}
