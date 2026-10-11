import { RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'
import { DEMO_TZ } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { SOURCE_LABEL, type Source } from './SourceTag'

export type SyncInfo = {
  source: Source
  // Время последнего успешного обмена; при сбое оно остаётся видимым, свободными даты не становятся
  lastSuccess: string
  failed?: boolean
  error?: string
}

export const SyncFreshness = ({ sync, className, compact }: { sync: SyncInfo; className?: string; compact?: boolean }) => (
  <span
    className={cn(
      'mono-label inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1',
      sync.failed ? 'bg-attention text-black' : 'bg-mist text-slate',
      className,
    )}
    title={sync.error}
  >
    {sync.failed ? <TriangleAlertIcon className="size-3" aria-hidden /> : <RefreshCwIcon className="size-3" aria-hidden />}
    {compact ? SOURCE_LABEL[sync.source] : `Обмен с ${SOURCE_LABEL[sync.source]}`}
    {sync.failed ? ' · сбой, успех ' : ' · '}
    {sync.lastSuccess} {DEMO_TZ}
  </span>
)
