import { XIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

import { Text } from './Typography'

type MistakeListProps = {
  items: string[]
  className?: string
}

// Типичные ошибки: сетка как у StepList — крестики встают в колонку цифр шагов,
// и два списка читаются одной лесенкой
export const MistakeList = ({ items, className }: MistakeListProps) => (
  <ul className={cn('flex flex-col gap-1.5', className)}>
    {items.map(item => (
      <li
        key={item}
        className='grid grid-cols-[24px_1fr] items-start gap-2'
      >
        <XIcon
          className='text-destructive mt-[3px] size-3.5'
          strokeWidth={3.5}
          aria-hidden
        />
        <Text
          as='span'
          tone='soft'
          className='first-letter:uppercase'
        >
          {item}
        </Text>
      </li>
    ))}
  </ul>
)
