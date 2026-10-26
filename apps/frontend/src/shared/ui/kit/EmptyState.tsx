import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

import { Eyebrow, Poster, Text } from './Typography'

type EmptyStateProps = {
  /** Надпись над заголовком: «пусто», «пусто · поиск» */
  eyebrow?: string
  title: string
  description?: ReactNode
  /** Кнопки одного размера: встают столбиком во всю ширину, главная — первой */
  action?: ReactNode
  className?: string
}

// Единый вид пустоты: плакатом слева, без рамки и иконки. Кнопки столбиком во всю ширину —
// кнопки разного размера и ширины рядом и давали «съехавший» вид
export const EmptyState = ({ eyebrow = 'пусто', title, description, action, className }: EmptyStateProps) => (
  <div className={cn('flex flex-col items-start gap-5 py-4', className)}>
    <div className='flex flex-col gap-2'>
      <Eyebrow as='p'>{eyebrow}</Eyebrow>
      <Poster
        as='h2'
        size='xl'
        className='text-balance'
      >
        {title}
      </Poster>
      {description && (
        <Text
          as='div'
          tone='soft'
          className='max-w-md'
        >
          {description}
        </Text>
      )}
    </div>
    {action && <div className='flex w-full max-w-md flex-col gap-2 *:w-full'>{action}</div>}
  </div>
)
