import { cn } from '@/shared/lib/utils'

type CountBadgeProps = {
  count: number
  className?: string
}

// Счётчик в углу кнопки: «Фильтры · 2», «Мои · 5». Кнопке нужен relative. Ноль не показываем, больше 99 — «99+»
export const CountBadge = ({ count, className }: CountBadgeProps) =>
  count > 0 ? (
    <span
      aria-hidden
      className={cn(
        'bg-primary text-primary-foreground border-foreground pointer-events-none absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center border-[1.5px] px-1 text-[11px] leading-none font-bold tabular-nums',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  ) : null
