import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

import { Eyebrow, Poster } from './Typography'

type Stat = { label: string; value: ReactNode }

type StatGridProps = {
  items: Stat[]
  /** В рамке — итоговая плашка; без рамки — строка показателей между линейками */
  framed?: boolean
  className?: string
}

// Строка показателей «число над подписью». Колонки делят ширину по содержимому: длинные подписи
// вроде «упражнений» не вылезают из ячейки на 320px
export const StatGrid = ({ items, framed, className }: StatGridProps) => (
  <dl
    className={cn(
      'grid grid-cols-[repeat(var(--cols),auto)]',
      framed ? 'border-foreground/80 border-[1.5px]' : 'border-border border-y-[1.5px]',
      className,
    )}
    style={{ '--cols': items.length } as CSSProperties}
  >
    {items.map((s, i) => (
      <div
        key={s.label}
        className={cn(
          // Зазор между цифрой и подписью задан здесь, а не межстрочным: при плотной строке они слипались
          'flex flex-col-reverse gap-2 py-3',
          framed ? 'px-2.5' : i > 0 && 'pl-3',
          i > 0 && 'border-l-[1.5px]',
          framed ? 'border-foreground/80' : 'border-border',
        )}
      >
        <Eyebrow
          as='dt'
          className='tracking-[0.08em]'
        >
          {s.label}
        </Eyebrow>
        <Poster
          as='dd'
          size='xl'
          className='leading-none'
        >
          {s.value}
        </Poster>
      </div>
    ))}
  </dl>
)
