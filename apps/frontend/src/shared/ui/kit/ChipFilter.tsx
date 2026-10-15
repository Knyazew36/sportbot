import { cn } from '@/shared/lib/utils'

import { Segmented } from './Segmented'

/** «Все» — значение без фильтра */
export const CHIP_ALL = 'all'

type ChipFilterProps = {
  options: { value: string; label: string }[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

// Один фильтр за раз над списком: «Все · Дом · Зал». Чипов может быть больше, чем влезает, —
// строка прокручивается вбок, а не переносится. Нет вариантов — нечего и показывать
export const ChipFilter = ({ options, value, onValueChange, className }: ChipFilterProps) =>
  options.length ? (
    <div className={cn('-mx-gutter px-gutter overflow-x-auto pb-1', className)}>
      <Segmented
        options={[{ value: CHIP_ALL, label: 'Все' }, ...options]}
        value={value}
        onValueChange={onValueChange}
        className='w-max'
      />
    </div>
  ) : null
