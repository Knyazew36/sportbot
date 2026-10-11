import { CircleSlashIcon, CloudOffIcon, InboxIcon, LockIcon, type LucideIcon } from 'lucide-react'
import type { DemoScreenState } from '@/shared/mock/state'
import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'

type StateCopy = {
  title: string
  description: React.ReactNode
  action?: React.ReactNode
}

type StateViewProps = {
  state: Exclude<DemoScreenState, 'ok'>
  empty?: StateCopy
  error?: StateCopy & { lastSuccess?: string }
  denied?: StateCopy
  // Форма скелета повторяет структуру экрана, а не абстрактный спиннер
  skeleton?: 'list' | 'cards' | 'grid' | 'record'
  className?: string
}

const DEFAULTS: Record<'empty' | 'error' | 'denied', StateCopy & { icon: LucideIcon }> = {
  empty: {
    icon: InboxIcon,
    title: 'Пока пусто',
    description: 'Здесь появятся записи, как только они будут созданы или получены с площадок.',
  },
  error: {
    icon: CloudOffIcon,
    title: 'Не удалось загрузить',
    description: 'Данные не получены. Показанное ниже может быть неактуальным — повторите попытку.',
  },
  denied: {
    icon: LockIcon,
    title: 'Нет доступа',
    description: 'У вашей роли нет права на этот раздел. Содержимое скрыто. Обратитесь к владельцу организации.',
  },
}

const SkeletonShape = ({ kind }: { kind: NonNullable<StateViewProps['skeleton']> }) => {
  if (kind === 'cards' || kind === 'grid') {
    return (
      <div className={cn('grid gap-4', kind === 'grid' ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
        {Array.from({ length: kind === 'grid' ? 6 : 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-card bg-card p-6">
            <Skeleton className="h-5 w-1/3 rounded-full" />
            <Skeleton className="h-4 w-2/3 rounded-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    )
  }
  if (kind === 'record') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-card bg-card p-6">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-10 w-1/2" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl bg-card" />
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1 rounded-card bg-card p-4">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-3xl p-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/3 rounded-full" />
            <Skeleton className="h-3 w-1/2 rounded-full" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export const StateView = ({ state, empty, error, denied, skeleton = 'list', className }: StateViewProps) => {
  if (state === 'loading') {
    return (
      <div className={className} aria-busy="true" aria-label="Загрузка">
        <SkeletonShape kind={skeleton} />
      </div>
    )
  }

  const copy = { ...DEFAULTS[state], ...{ empty, error, denied }[state] }
  const Icon = DEFAULTS[state].icon
  const lastSuccess = state === 'error' ? error?.lastSuccess : undefined

  return (
    <div
      role={state === 'error' ? 'alert' : undefined}
      className={cn(
        'flex flex-col items-start gap-6 rounded-card p-6 md:flex-row md:items-center md:p-10',
        state === 'denied' ? 'bg-foreground text-background' : 'bg-card',
        className,
      )}
    >
      <div
        className={cn(
          'flex size-16 shrink-0 items-center justify-center rounded-full',
          state === 'error' && 'bg-attention text-black',
          state === 'empty' && 'bg-mist text-slate',
          state === 'denied' && 'bg-background/10',
        )}
      >
        <Icon className="size-7" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="mono-label text-smoke">
          {state === 'empty' && 'Состояние · пусто'}
          {state === 'error' && 'Состояние · ошибка получения'}
          {state === 'denied' && 'Состояние · нет права'}
        </span>
        <h2 className="section-heading text-subheading-lg md:text-heading-sm">{copy.title}</h2>
        <p className={cn('max-w-xl text-body-sm', state === 'denied' ? 'text-smoke' : 'text-slate')}>{copy.description}</p>
        {lastSuccess && (
          <span className="mono-label mt-1 inline-flex items-center gap-1.5 text-slate">
            <CircleSlashIcon className="size-3" aria-hidden />
            Последние данные: {lastSuccess}
          </span>
        )}
      </div>
      {copy.action && <div className="flex shrink-0 flex-wrap gap-2">{copy.action}</div>}
    </div>
  )
}
