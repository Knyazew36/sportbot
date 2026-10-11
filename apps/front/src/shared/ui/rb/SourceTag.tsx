import { cn } from '@/shared/lib/utils'

export type Source = 'avito' | 'sutochno' | 'direct' | 'manual'

export const SOURCE_LABEL: Record<Source, string> = {
  avito: 'Авито',
  sutochno: 'Суточно',
  direct: 'Прямая',
  manual: 'Вручную',
}

// Источник — таксономия, а не статус: outline-тон, моноширинный, без цвета
export const SourceTag = ({ source, className, inverted }: { source: Source; className?: string; inverted?: boolean }) => (
  <span
    className={cn(
      'mono-label inline-flex h-5 shrink-0 items-center rounded-full border px-2 whitespace-nowrap',
      inverted ? 'border-current/40 text-current' : 'border-foreground/60 text-foreground',
      className,
    )}
  >
    {SOURCE_LABEL[source]}
  </span>
)
