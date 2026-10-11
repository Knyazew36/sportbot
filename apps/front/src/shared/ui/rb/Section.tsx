import { cn } from '@/shared/lib/utils'

type SectionCardProps = {
  title?: React.ReactNode
  // Счётчик или номер раздела в моно справа от заголовка
  count?: React.ReactNode
  action?: React.ReactNode
  inverted?: boolean
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}

// Белая карточка раздела: заголовок section-heading 20px, глубина только контрастом с холстом
export const SectionCard = ({ title, count, action, inverted, children, className, bodyClassName }: SectionCardProps) => (
  <section
    className={cn(
      'flex min-w-0 flex-col gap-4 rounded-card p-5 md:p-6',
      inverted ? 'bg-foreground text-background' : 'bg-card text-card-foreground',
      className,
    )}
  >
    {(title || action) && (
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-3">
          {title && <h2 className="section-heading truncate text-subheading-lg">{title}</h2>}
          {count != null && <span className={cn('mono-label', inverted ? 'text-smoke' : 'text-smoke')}>{count}</span>}
        </div>
        {action}
      </div>
    )}
    <div className={cn('flex min-w-0 flex-col', bodyClassName)}>{children}</div>
  </section>
)

// Пара «подпись — значение» для сводок в карточках записей
export const MetaItem = ({ label, children, className }: { label: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <div className={cn('flex min-w-0 flex-col gap-1', className)}>
    <dt className="mono-label text-smoke">{label}</dt>
    <dd className="text-body-sm font-medium">{children}</dd>
  </div>
)
