import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

import { Stagger } from './Reveal'
import { useScreenChrome } from './screen-chrome'

type ScreenProps = {
  header?: ReactNode
  /** Липкий низ: обычно StickyFooter с главным действием */
  footer?: ReactNode
  children: ReactNode
  className?: string
}

// Каркас экрана Mini App: шапка, контент с одним оркестрованным входом, липкий низ
export const Screen = ({ header, footer, children, className }: ScreenProps) => (
  <div className='flex flex-1 flex-col'>
    {header}
    <Stagger className={cn('flex flex-1 flex-col gap-8 pt-6 pb-8', className)}>{children}</Stagger>
    {footer}
  </div>
)

type StickyFooterProps = { children: ReactNode; className?: string }

// Главное действие у большого пальца: прилипает к низу экрана или над нижним меню.
// Кнопки — размера lg, по ширине надписи и прижаты вправо; не влезли — переносятся.
// Своя раскладка (таймер, подпись над кнопками) — через className='block'
export const StickyFooter = ({ children, className }: StickyFooterProps) => {
  const { navVisible } = useScreenChrome()
  return (
    <div
      className={cn(
        'bg-background/85 border-border sticky backdrop-blur-glass z-20 flex flex-wrap items-center justify-end gap-2 border-t-[1.5px] px-gutter pt-3',
        navVisible ? 'bottom-(--sb-nav-h) pb-3' : 'bottom-0 pb-[max(0.75rem,var(--sb-bottom-inset))]',
        className,
      )}
    >
      {children}
    </div>
  )
}
