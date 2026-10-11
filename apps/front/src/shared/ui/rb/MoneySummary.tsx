import { formatMoney, NO_DATA } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

export type MoneyLine = {
  label: string
  value: number | null
  note?: string
  // Заявленные суммы не смешиваются с подтверждёнными: показываем отдельной интонацией
  kind?: 'confirmed' | 'claimed' | 'total' | 'deposit'
}

export const MoneySummary = ({ lines, className, inverted }: { lines: MoneyLine[]; className?: string; inverted?: boolean }) => (
  <dl className={cn('flex flex-col', className)}>
    {lines.map((line) => {
      const unknown = line.value == null
      return (
        <div
          key={line.label}
          className={cn(
            'flex items-baseline justify-between gap-4 border-b py-3 last:border-0',
            inverted ? 'border-background/15' : 'border-mist',
            line.kind === 'total' && 'pt-4',
          )}
        >
          <dt className="flex min-w-0 flex-col gap-0.5">
            <span className={cn('text-body-sm', line.kind === 'total' && 'font-medium')}>{line.label}</span>
            {line.note && <span className="mono-label text-smoke">{line.note}</span>}
          </dt>
          <dd
            className={cn(
              'shrink-0 text-right tabular-nums',
              line.kind === 'total' ? 'text-subheading-lg font-medium' : 'text-body font-medium',
              unknown && 'mono-label rounded-full bg-mist px-2 py-0.5 text-slate',
              line.kind === 'claimed' && !unknown && 'rounded-full bg-attention px-2 text-black',
            )}
          >
            {unknown ? NO_DATA : formatMoney(line.value)}
          </dd>
        </div>
      )
    })}
  </dl>
)
