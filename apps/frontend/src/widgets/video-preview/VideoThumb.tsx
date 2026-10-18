import type { CompositionId, CompositionProps } from '@sportbot/render-contract'
import { previewOf } from '@sportbot/video/previews'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/shared/lib/utils'

import { CHECKER } from './VideoPreview'

type Props<Id extends CompositionId> = {
  compositionId: Id
  props: CompositionProps<Id>
  className?: string
}

// Миниатюра ролика для карточки: та же вёрстка, что в превью, но стоит на месте — без выезда и таймлайна
export const VideoThumb = <Id extends CompositionId>({ compositionId, props, className }: Props<Id>) => {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const { component: Preview } = previewOf(compositionId, props)

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
      aria-hidden
      className={cn('overflow-hidden px-[6%] py-6', className)}
      style={{ background: CHECKER }}
    >
      {width > 0 && (
        <div className='w-fit max-w-full'>
          <Preview
            props={props}
            unit={width}
          />
        </div>
      )}
    </div>
  )
}
