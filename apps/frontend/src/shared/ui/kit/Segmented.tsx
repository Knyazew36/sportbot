import { cn } from '@/shared/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'

type SegmentedProps<T extends string> = {
  options: readonly (T | { value: T; label: string })[]
  value: T
  onValueChange: (value: T) => void
  size?: 'sm' | 'default'
  /** Растянуть сегменты на всю ширину поровну */
  stretch?: boolean
  /** Значение «без выбора»: повторное нажатие на выбранный сегмент снимает его и ставит это значение */
  emptyValue?: T
  className?: string
}

// Выбор одного из нескольких: период графика, длительность отдыха, куда слать напоминания.
// Повторное нажатие на выбранный сегмент не снимает выбор — значение есть всегда.
// Фильтрам передаём emptyValue: там повторное нажатие сбрасывает фильтр на «Все»
export const Segmented = <T extends string>({
  options,
  value,
  onValueChange,
  size = 'sm',
  stretch,
  emptyValue,
  className,
}: SegmentedProps<T>) => (
  <ToggleGroup
    value={[value]}
    onValueChange={([next]) => {
      if (next) onValueChange(next as T)
      else if (emptyValue !== undefined) onValueChange(emptyValue)
    }}
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
