import { cn } from '@/shared/lib/utils'

export type HistoryEntry = {
  id: string
  at: string
  author: string
  text: React.ReactNode
  // Основание изменения: обмен с площадкой, решение владельца, правило серии
  reason?: string
  system?: boolean
}

export const HistoryFeed = ({ entries, className }: { entries: HistoryEntry[]; className?: string }) => (
  <ol className={cn('relative flex flex-col', className)}>
    {entries.map((entry, index) => (
      <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
        {index < entries.length - 1 && <span className="absolute top-4 bottom-0 left-[5px] w-px bg-ash" aria-hidden />}
        <span
          className={cn(
            'relative mt-1.5 size-[11px] shrink-0 rounded-full border-2',
            entry.system ? 'border-ash bg-card' : 'border-foreground bg-foreground',
          )}
          aria-hidden
        />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="mono-label text-smoke">
            {entry.at} · {entry.author}
          </span>
          <span className="text-body-sm">{entry.text}</span>
          {entry.reason && <span className="mono-label text-slate">Основание: {entry.reason}</span>}
        </div>
      </li>
    ))}
  </ol>
)
