import { cn } from '@/shared/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'

type SegmentedProps<T extends string> = {
  options: readonly (T | { value: T; label: string })[]
  value: T
  onValueChange: (value: T) => void
  size?: 'sm' | 'default'
  /** Растянуть сегменты на всю ширину поровну */
  stretch?: boolean
  className?: string
}

// Выбор одного из нескольких: период графика, длительность отдыха, куда слать напоминания.
// Повторное нажатие на выбранный сегмент не снимает выбор — значение есть всегда
export const Segmented = <T extends string>({
  options,
  value,
  onValueChange,
  size = 'sm',
  stretch,
  className,
}: SegmentedProps<T>) => (
  <ToggleGroup
    value={[value]}
    onValueChange={([next]) => next && onValueChange(next as T)}
    className={cn(stretch && 'grid w-full auto-cols-fr grid-flow-col', className)}
  >
    {options.map(o => {
      const { value: v, label } = typeof o === 'string' ? { value: o, label: o } : o
      return (
        <ToggleGroupItem
          key={v}
          value={v}
          size={size}
        >
          {label}
        </ToggleGroupItem>
      )
    })}
  </ToggleGroup>
)
