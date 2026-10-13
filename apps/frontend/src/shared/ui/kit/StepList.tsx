import { cn } from '@/shared/lib/utils'

import { Poster, Text } from './Typography'

type StepListProps = {
  items: string[]
  /** Крупнее — когда шаги читают на вытянутой руке посреди упражнения */
  size?: 'md' | 'lg'
  className?: string
}

// Пронумерованные шаги: техника упражнения, «как делать» у растяжки
export const StepList = ({ items, size = 'md', className }: StepListProps) => (
  <ol className={cn('flex flex-col', size === 'lg' ? 'gap-3' : 'gap-2.5', className)}>
    {items.map((item, i) => (
      <li
        key={item}
        className='grid grid-cols-[24px_1fr] items-baseline gap-2'
      >
        <Poster
          as='span'
          size={size === 'lg' ? 'md' : 'sm'}
          tone='primary'
          numeric
        >
          {i + 1}
        </Poster>
        <Text
          as='span'
          size={size === 'lg' ? 'lg' : 'md'}
        >
          {item}
        </Text>
      </li>
    ))}
  </ol>
)
