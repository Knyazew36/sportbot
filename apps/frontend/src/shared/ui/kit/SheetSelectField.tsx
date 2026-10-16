import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/shared/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

import { OptionButton } from './OptionButton'

type Option = { value: string; label: string }

type SheetSelectFieldProps = {
  options: readonly Option[]
  value: string
  onValueChange: (value: string) => void
  /** Заголовок шторки и подпись для скринридера */
  title: string
  placeholder?: string
  className?: string
}

// Длинный выбор (город для часового пояса): выпадашка на телефоне то вылезает за экран, то
// прыгает вверх, поэтому список всегда в шторке снизу и прокручивается внутри неё
export const SheetSelectField = ({
  options,
  value,
  onValueChange,
  title,
  placeholder = 'Выбрать',
  className,
}: SheetSelectFieldProps) => {
  const [open, setOpen] = useState(false)
  const current = options.find(o => o.value === value)

  return (
    <>
      <button
        type='button'
        aria-label={title}
        aria-haspopup='dialog'
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-12 w-full items-center justify-between gap-1.5 border-[1.5px] border-input bg-background px-3.5 py-2 text-left text-[16px] outline-none transition-colors focus-visible:border-primary',
          className,
        )}
      >
        <span className={cn('line-clamp-1', !current && 'text-muted-foreground')}>
          {current?.label ?? placeholder}
        </span>
        <ChevronDownIcon className='pointer-events-none size-4 shrink-0 text-muted-foreground' />
      </button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div
            // При открытии сразу показываем выбранный пункт, а не начало длинного списка
            ref={el => el?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'center' })}
            className='flex min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain px-gutter pb-6'
          >
            {options.map(o => (
              <OptionButton
                key={o.value}
                title={o.label}
                selected={o.value === value}
                onClick={() => {
                  onValueChange(o.value)
                  setOpen(false)
                }}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
