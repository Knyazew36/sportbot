import { ArrowLeftIcon } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/shared/lib/utils'

type RecordHeaderProps = {
  back?: { to: string; label: string }
  // Номер записи, тип — mono над заголовком
  eyebrow: React.ReactNode
  title: React.ReactNode
  status?: React.ReactNode
  facts?: { label: string; value: React.ReactNode }[]
  primaryAction?: React.ReactNode
  secondaryActions?: React.ReactNode
  className?: string
}

// Шапка записи (бронь, задача, объект): номер, статус, ключевые факты и одно главное действие
export const RecordHeader = ({ back, eyebrow, title, status, facts, primaryAction, secondaryActions, className }: RecordHeaderProps) => (
  <header className={cn('flex flex-col gap-6 rounded-card bg-card p-5 md:p-8', className)}>
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {back && (
            <Link
              to={back.to}
              className="mono-label inline-flex items-center gap-1 rounded-full bg-mist px-2.5 py-1 text-slate hover:text-foreground"
            >
              <ArrowLeftIcon className="size-3" aria-hidden />
              {back.label}
            </Link>
          )}
          <span className="mono-label text-smoke">{eyebrow}</span>
        </div>
        <h1 className="section-heading text-heading-sm md:display-heading md:text-heading-lg">{title}</h1>
        {status && <div className="flex flex-wrap items-center gap-2">{status}</div>}
      </div>
      {(primaryAction || secondaryActions) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {secondaryActions}
          {primaryAction}
        </div>
      )}
    </div>
    {facts && facts.length > 0 && (
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-mist pt-6 md:grid-cols-3 lg:grid-cols-6">
        {facts.map((fact) => (
          <div key={fact.label} className="flex min-w-0 flex-col gap-1">
            <dt className="mono-label text-smoke">{fact.label}</dt>
            <dd className="truncate text-body-sm font-medium">{fact.value}</dd>
          </div>
        ))}
      </dl>
    )}
  </header>
)
