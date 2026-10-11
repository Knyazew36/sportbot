import { ChevronRightIcon, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/shared/lib/utils'

type EventCardProps = {
  to: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  // Время или дата слева — главная опора взгляда в ленте событий
  time?: React.ReactNode
  timeNote?: React.ReactNode
  icon?: LucideIcon
  badges?: React.ReactNode
  inverted?: boolean
  className?: string
}

// Строка события ведёт к записи целиком: вся карточка — ссылка, без вложенных кнопок
export const EventCard = ({ to, title, subtitle, time, timeNote, icon: Icon, badges, inverted, className }: EventCardProps) => (
  <Link
    to={to}
    className={cn(
      'group/event flex items-center gap-4 rounded-3xl p-3 outline-none transition-colors focus-visible:ring-3 md:gap-5 md:p-4',
      inverted ? 'hover:bg-background/10 focus-visible:ring-background/40' : 'hover:bg-mist focus-visible:ring-ring/30',
      className,
    )}
  >
    {time != null && (
      <div className="flex w-14 shrink-0 flex-col md:w-16">
        <span className="text-subheading-lg font-medium tabular-nums">{time}</span>
        {timeNote && <span className="mono-label text-smoke">{timeNote}</span>}
      </div>
    )}
    {Icon && (
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          inverted ? 'bg-background/10' : 'bg-mist',
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
    )}
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-body font-medium leading-tight">{title}</span>
      {subtitle && <span className="text-body-sm text-smoke">{subtitle}</span>}
      {badges && <div className="flex flex-wrap items-center gap-1.5 md:hidden">{badges}</div>}
    </div>
    {badges && <div className="hidden shrink-0 flex-wrap items-center justify-end gap-1.5 md:flex">{badges}</div>}
    <ChevronRightIcon
      className={cn('size-4 shrink-0 transition-transform group-hover/event:translate-x-0.5', inverted ? 'text-smoke' : 'text-smoke')}
      aria-hidden
    />
  </Link>
)
