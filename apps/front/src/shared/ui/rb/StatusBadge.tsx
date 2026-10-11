import type { LucideIcon } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

// Статус не кодируется только цветом (§9): у бейджа всегда есть иконка и текст
const statusBadgeVariants = cva(
  'inline-flex h-7 w-fit shrink-0 items-center gap-1.5 rounded-full px-3 text-body-sm font-medium whitespace-nowrap [&>svg]:size-3.5 [&>svg]:shrink-0',
  {
    variants: {
      tone: {
        // Текст на mint/voltage всегда чёрный: акцент одинаковый в обеих темах
        success: 'bg-success text-black',
        attention: 'bg-attention text-black',
        danger: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
        neutral: 'bg-mist text-slate',
        inverse: 'bg-foreground text-background',
        outline: 'border border-foreground text-foreground',
      },
      size: {
        default: '',
        sm: 'h-6 px-2.5 text-caption [&>svg]:size-3',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'default' },
  },
)

export type StatusTone = NonNullable<VariantProps<typeof statusBadgeVariants>['tone']>

export type StatusBadgeProps = VariantProps<typeof statusBadgeVariants> & {
  icon: LucideIcon
  children: React.ReactNode
  className?: string
}

export const StatusBadge = ({ tone, size, icon: Icon, children, className }: StatusBadgeProps) => (
  <span data-slot="status-badge" className={cn(statusBadgeVariants({ tone, size }), className)}>
    <Icon aria-hidden />
    {children}
  </span>
)

// Описание статуса как данных: сущности хранят словари «код → тон, иконка, подпись»
export type StatusMeta = { tone: StatusTone; icon: LucideIcon; label: string }

export const StatusFromMeta = ({ meta, size, className }: { meta: StatusMeta } & Pick<StatusBadgeProps, 'size' | 'className'>) => (
  <StatusBadge tone={meta.tone} icon={meta.icon} size={size} className={className}>
    {meta.label}
  </StatusBadge>
)
