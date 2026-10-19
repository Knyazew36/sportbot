import { motion } from 'motion/react'

import { cn } from '@/shared/lib/utils'
import { haptic } from '@/shared/miniapp'

type PosterTabsProps<T extends string> = {
  tabs: readonly { value: T; label: string }[]
  value: T
  onValueChange: (value: T) => void
  className?: string
}

// Разделы экрана плакатными словами с жирной чертой под выбранным. Нарочно не похожи на Segmented:
// под ними часто стоит переключатель периода, и два ряда одинаковых кнопок читались бы как один выбор
export const PosterTabs = <T extends string>({ tabs, value, onValueChange, className }: PosterTabsProps<T>) => (
  <div
    role='tablist'
    className={cn('border-border no-scrollbar flex gap-5 overflow-x-auto border-b-[1.5px]', className)}
  >
    {tabs.map(tab => {
      const active = tab.value === value
      return (
        <button
          key={tab.value}
          type='button'
          role='tab'
          aria-selected={active}
          onClick={() => {
            if (active) return
            haptic.select()
            onValueChange(tab.value)
          }}
          className={cn(
            'sb-poster relative shrink-0 pb-2.5 text-[22px] transition-colors outline-none focus-visible:underline',
            active ? 'text-foreground' : 'text-foreground/35',
          )}
        >
          {tab.label}
          {active && (
            <motion.span
              layoutId='poster-tab'
              className='bg-primary absolute inset-x-0 -bottom-[1.5px] h-1'
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          )}
        </button>
      )
    })}
  </div>
)
