import { SearchIcon, XIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/shadcn/input'

type SearchFieldProps = {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

// Поиск по названию: лупа слева, крестик очистки справа, когда что-то введено
export const SearchField = ({ value, onValueChange, placeholder = 'Название', className }: SearchFieldProps) => (
  <div className={cn('relative', className)}>
    <SearchIcon className='text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2' />
    <Input
      type='search'
      value={value}
      onChange={e => onValueChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className='px-10 [&::-webkit-search-cancel-button]:hidden'
    />
    {value && (
      <button
        type='button'
        onClick={() => onValueChange('')}
        className='text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center'
        aria-label='Очистить поиск'
      >
        <XIcon className='size-4' />
      </button>
    )}
  </div>
)
