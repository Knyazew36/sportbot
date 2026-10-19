import { motion, useReducedMotion } from 'motion/react'

import { cn } from '@/shared/lib/utils'
import { haptic } from '@/shared/miniapp'

type PosterTabsProps<T extends string> = {
  tabs: readonly { value: T; label: string }[]
  value: T
  onValueChange: (value: T) => void
  className?: string
}

// Разделы экрана как оглавление из глав: одна рамка с жёсткой тенью, равные ячейки «01 / ПРОГРЕСС».
// Выбранная глава залита «чернилами» — не цветом бренда, которым отмечен выбранный период ниже; заливка переезжает пружиной. Нарочно не похожи на Segmented:
// под ними стоит переключатель периода, и два ряда одинаковых кнопок читались бы как один выбор
export const PosterTabs = <T extends string>({ tabs, value, onValueChange, className }: PosterTabsProps<T>) => {
  const still = useReducedMotion()

  return (
    <div
      role='tablist'
      className={cn(
        'border-foreground divide-foreground/80 mr-[3px] mb-[3px] grid auto-cols-fr grid-flow-col divide-x-[1.5px] border-[1.5px] shadow-[3px_3px_0_var(--sb-ink)]',
        className,
      )}
    >
      {tabs.map((tab, i) => {
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
              'group relative flex min-w-0 flex-col items-start gap-1 px-2.5 pt-2 pb-2.5 text-left outline-none',
              'focus-visible:ring-ring/25 focus-visible:ring-4 focus-visible:ring-inset',
              !active && 'active:hatch',
            )}
          >
            {active && (
              <motion.span
                layoutId='poster-tab-fill'
                aria-hidden
                className='bg-foreground absolute inset-0'
                transition={still ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 38 }}
              />
            )}
            <span
              className={cn(
                'font-grotesk relative text-[10.5px] leading-none tracking-[0.14em] tabular-nums transition-colors',
                'text-primary',
              )}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              className={cn(
                'sb-poster relative max-w-full truncate text-[min(19px,5vw)] leading-[1.1] transition-colors',
                active ? 'text-background' : 'text-foreground/45 group-hover:text-foreground/70',
              )}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
