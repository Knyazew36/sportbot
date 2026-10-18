import type { CompositionId, CompositionProps } from '@sportbot/render-contract'
import { previewOf } from '@sportbot/video/previews'
import { motion } from 'motion/react'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/shared/lib/utils'

type Props<Id extends CompositionId> = {
  compositionId: Id
  props: CompositionProps<Id>
  className?: string
}

// Шахматка — как в монтажке: видно, что фон у ролика прозрачный
const CHECKER =
  'repeating-conic-gradient(color-mix(in oklab, var(--sb-ink) 10%, transparent) 0 25%, transparent 0 50%) 0 0 / 20px 20px'

// Кривая появления — та же, что у плашки в ролике (motion.ease.enter в @sportbot/brand)
const ENTER = [0.2, 0, 0, 1] as const

/**
 * Превью ролика без плеера: та же вёрстка, что рендерит сервер, статичной карточкой. Размеры
 * считаются от ширины блока, как в ролике — от ширины кадра. Появление проигрывается заново,
 * когда меняется оформление, а не на каждую букву
 */
export const VideoPreview = <Id extends CompositionId>({ compositionId, props, className }: Props<Id>) => {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const Preview = previewOf(compositionId)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn('border-foreground overflow-hidden border-[1.5px] px-[6%] py-8', className)}
      style={{ background: CHECKER }}
    >
      {width > 0 && (
        <motion.div
          key={'fill' in props ? String(props.fill) : compositionId}
          initial={{ x: '-120%' }}
          animate={{ x: 0 }}
          transition={{ duration: 0.45, ease: ENTER }}
          className='w-fit max-w-full'
        >
          <Preview
            props={props}
            unit={width}
          />
        </motion.div>
      )}
    </div>
  )
}
