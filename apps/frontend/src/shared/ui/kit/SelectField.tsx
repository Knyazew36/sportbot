import { cn } from '@/shared/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

type Option = { value: string; label: string }

type SelectFieldProps = {
  options: readonly Option[]
  value: string
  onValueChange: (value: string) => void
  /** Подпись для скринридера, когда видимой подписи нет */
  ariaLabel?: string
  className?: string
}

// Выбор из списка одной строкой: упражнение для графика, часовой пояс, частота вопроса
export const SelectField = ({ options, value, onValueChange, ariaLabel, className }: SelectFieldProps) => (
  <Select
    items={options}
    value={value}
    onValueChange={v => v != null && onValueChange(v as string)}
  >
    <SelectTrigger
      aria-label={ariaLabel}
      className={cn('w-full', className)}
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent alignItemWithTrigger={false}>
      {options.map(o => (
        <SelectItem
          key={o.value}
          value={o.value}
        >
          {o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)
