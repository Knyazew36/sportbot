import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

import { Poster, Text } from './Typography'

export const List = ({ children, className }: { children: ReactNode; className?: string }) => (
  <ol className={cn('border-border border-t-[1.5px]', className)}>{children}</ol>
)

type ListRowProps = {
  /** Номер или значок слева, плакатным шрифтом */
  lead?: ReactNode
  title: ReactNode
  meta?: ReactNode
  /** Значение или действие справа */
  trail?: ReactNode
  /** Доп. содержимое под подписью: предупреждения, кнопки */
  children?: ReactNode
  className?: string
}

// Строка списка между линейками: упражнения, программы, друзья, растяжки
export const ListRow = ({ lead, title, meta, trail, children, className }: ListRowProps) => (
  <li
    className={cn(
      'border-border grid items-start gap-x-3 border-b-[1.5px] py-3.5',
      lead != null ? 'grid-cols-[minmax(28px,auto)_1fr_auto]' : 'grid-cols-[1fr_auto]',
      className,
    )}
  >
    {lead != null && (
      <Poster
        as='span'
        tone='primary'
        className='pt-0.5'
      >
        {lead}
      </Poster>
    )}
    <div className='min-w-0'>
      <Text
        size='lg'
        className='leading-tight'
      >
        {title}
      </Text>
      {meta && (
        <Text
          size='xs'
          tone='muted'
          className='mt-1'
        >
          {meta}
        </Text>
      )}
      {children}
    </div>
    {trail != null ? <div className='self-center'>{trail}</div> : <span />}
  </li>
)
