import { CloudOffIcon, type LucideIcon } from 'lucide-react'

import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'

import { EmptyState } from './EmptyState'
import { Poster, Text } from './Typography'

type ScreenStateProps = {
  state: 'loading' | 'empty' | 'error'
  title?: string
  description?: ReactNode
  /** «Повторить» для ошибки, подсказка-действие для пустого списка */
  action?: ReactNode
  /** Иконка ошибки; у пустоты иконки нет */
  icon?: LucideIcon
  /** Сколько строк-скелетов показать при загрузке */
  rows?: number
  className?: string
}

const DEFAULTS = {
  empty: { title: 'Пока пусто', description: 'Здесь появятся записи.' },
  error: {
    icon: CloudOffIcon,
    title: 'Нет связи',
    description: 'Не получилось загрузить. Проверь интернет и попробуй ещё раз.',
  },
}

// Три обязательных состояния любого списка и экрана данных (frontend-tz, раздел 15).
// Загрузка повторяет форму списка строками, а не крутит абстрактный спиннер
export const ScreenState = ({ state, title, description, action, icon, rows = 4, className }: ScreenStateProps) => {
  if (state === 'loading') {
    return (
      <div
        className={cn('border-border border-t-[1.5px]', className)}
        aria-busy='true'
        aria-label='Загрузка'
      >
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className='border-border flex items-center gap-3 border-b-[1.5px] py-3.5'
          >
            <Skeleton className='size-14 shrink-0' />
            <div className='flex flex-1 flex-col gap-2'>
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-3 w-1/3' />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (state === 'empty') {
    return (
      <EmptyState
        title={title ?? DEFAULTS.empty.title}
        description={description ?? DEFAULTS.empty.description}
        action={action}
        className={className}
      />
    )
  }

  const Icon = icon ?? DEFAULTS.error.icon
  return (
    <div
      role='alert'
      className={cn('border-destructive/60 flex flex-col items-start gap-3 border-[1.5px] border-dashed p-5', className)}
    >
      <span className='bg-background border-destructive text-destructive flex size-12 items-center justify-center border-[1.5px]'>
        <Icon
          className='size-6'
          aria-hidden
        />
      </span>
      <div className='bg-background flex flex-col gap-1 pr-2'>
        <Poster size='lg'>{title ?? DEFAULTS.error.title}</Poster>
        <Text tone='soft'>{description ?? DEFAULTS.error.description}</Text>
      </div>
      {action}
    </div>
  )
}
