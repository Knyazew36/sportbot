import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router'

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
  /** Строка суперсета: участников подряд связывает общая линия слева */
  linked?: boolean
  className?: string
}

// Строка списка между линейками: упражнения, программы, друзья, растяжки
export const ListRow = ({ lead, title, meta, trail, children, linked, className }: ListRowProps) => (
  <li
    className={cn(
      'border-border grid items-start gap-x-3 border-b-[1.5px] py-3.5',
      linked && 'border-l-primary border-l-[3px] pl-2',
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

type ListLinkRowProps = Omit<ListRowProps, 'trail'> & { to: string }

// Строка-переход: кликабельна целиком, справа стрелка. Ссылка — только заголовок, чтобы кнопки
// в children оставались отдельными целями
export const ListLinkRow = ({ to, title, className, ...rest }: ListLinkRowProps) => (
  <ListRow
    {...rest}
    className={cn('relative', className)}
    title={
      <Link
        to={to}
        className='underline-offset-4 after:absolute after:inset-0 hover:underline'
      >
        {title}
      </Link>
    }
    trail={<ChevronRightIcon className='text-foreground/40 size-5' />}
  />
)
