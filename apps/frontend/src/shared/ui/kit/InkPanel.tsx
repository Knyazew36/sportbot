import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

// Чёрная плашка с разметкой беговых дорожек: главный акцент экрана (серия, таймер отдыха)
export const InkPanel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('bg-foreground text-background relative overflow-hidden', className)}>
    <div className='sb-lanes pointer-events-none absolute inset-0 opacity-[0.13]' />
    <div className='relative'>{children}</div>
  </div>
)
