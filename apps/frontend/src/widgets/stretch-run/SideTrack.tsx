import { CheckIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography'

const SIDES = ['Правая', 'Левая'] as const

// Какую сторону тянем сейчас. Крупно над названием, а не значком на картинке:
// на низком экране картинка скрыта, и сторона пропадала вместе с ней
export const SideTrack = ({ side }: { side: 1 | 2 }) => (
  <div>
    <Eyebrow
      as='p'
      className='mb-2'
    >
      сторона {side} из 2
    </Eyebrow>
    <div className='grid grid-cols-2 gap-2'>
      {SIDES.map((label, i) => {
        const n = i + 1
        return (
          <div
            key={label}
            className={cn(
              'border-foreground flex h-12 items-center justify-center gap-1.5 border-[1.5px]',
              n === side && 'bg-primary text-primary-foreground shadow-[3px_3px_0_var(--sb-ink)] dark:shadow-none',
              n < side && 'text-muted-foreground border-border',
              n > side && 'text-foreground/40 border-border border-dashed',
            )}
          >
            {n < side && (
              <CheckIcon
                className='size-4'
                strokeWidth={2.5}
              />
            )}
            <Poster
              as='span'
              size='sm'
            >
              {label}
            </Poster>
          </div>
        )
      })}
    </div>
  </div>
)
