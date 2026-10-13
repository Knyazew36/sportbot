import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

import { Poster, Text } from './Typography'

type TicketProps = {
  /** Буква комплекса */
  mark: ReactNode
  title: ReactNode
  /** Следующий по ротации — подсвечен */
  active?: boolean
  children?: ReactNode
  className?: string
}

// Комплекс в ротации — как билет с вырезом корешка
export const Ticket = ({ mark, title, active, children, className }: TicketProps) => (
  <div
    className={cn(
      'relative flex w-[152px] shrink-0 flex-col gap-6 border-[1.5px] p-3',
      active ? 'border-primary bg-accent' : 'border-border',
      className,
    )}
  >
    <span className='bg-background absolute top-1/2 -right-[7px] size-3 -translate-y-1/2 rounded-full border-[1.5px] border-inherit' />
    <Poster
      as='span'
      size='2xl'
      tone={active ? 'primary' : 'faint'}
    >
      {mark}
    </Poster>
    <Text
      as='span'
      size='sm'
      className='leading-tight'
    >
      {title}
    </Text>
    {children}
  </div>
)
