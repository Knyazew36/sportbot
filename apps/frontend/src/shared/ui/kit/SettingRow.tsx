import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

import { Text } from './Typography'

type SettingRowProps = {
  title: ReactNode
  hint?: ReactNode
  /** id контрола: клик по подписи переключает его */
  htmlFor?: string
  children: ReactNode
  className?: string
}

// Строка настройки: подпись с пояснением слева, контрол справа
export const SettingRow = ({ title, hint, htmlFor, children, className }: SettingRowProps) => (
  <div className={cn('border-border flex items-center justify-between gap-4 border-b-[1.5px] py-3.5', className)}>
    <label
      htmlFor={htmlFor}
      className='min-w-0'
    >
      <Text
        as='span'
        size='lg'
        className='block leading-tight'
      >
        {title}
      </Text>
      {hint && (
        <Text
          as='span'
          size='xs'
          tone='muted'
          className='mt-1 block'
        >
          {hint}
        </Text>
      )}
    </label>
    <div className='shrink-0'>{children}</div>
  </div>
)
