import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export type Consequence = { icon: LucideIcon; area: string; text: string; severity?: 'info' | 'warn' }

// Последствия до необратимого действия: влияние на даты, задачи, доступ и деньги видно заранее
export const ConsequencesPreview = ({
  items,
  title = 'Что изменится',
  className,
}: {
  items: Consequence[]
  title?: string
  className?: string
}) => (
  <div className={cn('flex flex-col gap-3 rounded-3xl bg-mist p-4', className)}>
    <span className="mono-label text-smoke">{title}</span>
    <ul className="flex flex-col gap-3">
      {items.map(({ icon: Icon, area, text, severity }) => (
        <li key={area} className="flex items-start gap-3">
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full',
              severity === 'warn' ? 'bg-attention text-black' : 'bg-card',
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-body-sm font-medium">{area}</span>
            <span className="text-body-sm text-slate">{text}</span>
          </div>
        </li>
      ))}
    </ul>
  </div>
)
