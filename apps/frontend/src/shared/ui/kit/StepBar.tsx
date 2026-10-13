import { cn } from '@/shared/lib/utils'

type StepBarProps = {
  total: number
  /** Текущий шаг с нуля: пройденные и текущий залиты */
  current: number
  className?: string
}

// Полоса шагов мастера: первый запуск, своё упражнение. Подпись «шаг 2 из 3» — рядом, в шапке
export const StepBar = ({ total, current, className }: StepBarProps) => (
  <div
    className={cn('flex gap-1', className)}
    role='progressbar'
    aria-valuemin={1}
    aria-valuemax={total}
    aria-valuenow={current + 1}
    aria-label={`Шаг ${current + 1} из ${total}`}
  >
    {Array.from({ length: total }, (_, i) => (
      <span
        key={i}
        className={cn('h-1 flex-1 transition-colors duration-300', i <= current ? 'bg-primary' : 'bg-border')}
      />
    ))}
  </div>
)
