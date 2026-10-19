import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import { haptic } from '@/shared/miniapp'

import { Eyebrow, Poster, Text } from './Typography'

type TicketProps = {
  /** Буква комплекса */
  mark: ReactNode
  /** Подпись над буквой — что это за билет, например «Тренировка» */
  kicker?: ReactNode
  title: ReactNode
  /** Следующий по очереди — подсвечен */
  active?: boolean
  /** Билет нажимается — например, открывает состав комплекса */
  onClick?: () => void
  children?: ReactNode
  className?: string
}

// Комплекс в очереди — как билет с вырезом корешка.
// Нажимаемый билет получает жёсткую тень, как у кнопок: тень — признак «сюда можно тыкать»
export const Ticket = ({ mark, kicker, title, active, onClick, children, className }: TicketProps) => {
  const Root = onClick ? 'button' : 'div'
  return (
    <Root
      {...(onClick && {
        type: 'button' as const,
        onClick: () => {
          haptic.tap()
          onClick()
        },
      })}
      className={cn(
        'relative flex w-[152px] shrink-0 flex-col gap-6 border-[1.5px] p-3 text-left',
        active ? 'border-primary bg-accent' : 'border-border',
        onClick &&
          'mr-[3px] mb-[3px] cursor-pointer shadow-[3px_3px_0_var(--press)] transition-[translate,box-shadow] duration-100 outline-none focus-visible:ring-4 focus-visible:ring-ring/25 active:translate-[3px] active:shadow-none',
        onClick && (active ? '[--press:var(--sb-blue)]' : '[--press:var(--sb-ink)]'),
        className,
      )}
    >
      <span className='bg-background absolute top-1/2 -right-[7px] size-3 -translate-y-1/2 rounded-full border-[1.5px] border-inherit' />
      <span className='flex flex-col gap-1'>
        {kicker && (
          <Eyebrow
            size='sm'
            tone={active ? 'primary' : 'muted'}
          >
            {kicker}
          </Eyebrow>
        )}
        <Poster
          as='span'
          size='2xl'
          tone={active ? 'primary' : 'faint'}
        >
          {mark}
        </Poster>
      </span>
      <span className='flex flex-col gap-1.5'>
        <Text
          as='span'
          size='sm'
          className='leading-tight'
        >
          {title}
        </Text>
        {children}
      </span>
    </Root>
  )
}
