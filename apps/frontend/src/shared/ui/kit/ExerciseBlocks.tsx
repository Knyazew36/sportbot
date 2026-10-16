import { Fragment, type ReactNode } from 'react'

import { supersetLabels, supersetLetter } from '@/shared/lib/superset'

import { Eyebrow } from './Typography'

type ExerciseBlocksProps<T> = {
  items: T[]
  /** Строка упражнения (ListRow); label — «A1» у участника суперсета, иначе null */
  children: (item: T, index: number, label: string | null) => ReactNode
}

// Упражнения внутри List: одиночные — обычными строками, суперсет — группой с заголовком и рамкой слева,
// чтобы с первого взгляда было видно, что эти упражнения делаются вместе по кругу
export const ExerciseBlocks = <T extends { superset: number | null }>({ items, children }: ExerciseBlocksProps<T>) => {
  const labels = supersetLabels(items)
  const blocks: { superset: number | null; indexes: number[] }[] = []
  items.forEach((item, i) => {
    const last = blocks.at(-1)
    if (last && item.superset !== null && last.superset === item.superset) last.indexes.push(i)
    else blocks.push({ superset: item.superset, indexes: [i] })
  })

  return blocks.map(block => {
    const rows = block.indexes.map(i => <Fragment key={i}>{children(items[i]!, i, labels[i] ?? null)}</Fragment>)
    if (block.superset === null) return rows
    return (
      <li
        key={`s${block.superset}`}
        className='border-border grid grid-cols-[auto_1fr] gap-x-3 border-b-[1.5px] py-2'
      >
        {/* Надпись вдоль блока: суперсет видно сразу, а строкам упражнений не нужна лишняя шапка */}
        <div className='bg-primary text-primary-foreground flex w-6 items-center justify-center'>
          <Eyebrow
            as='span'
            tone='inherit'
            className='rotate-180 py-2 whitespace-nowrap [writing-mode:vertical-rl]'
          >
            Суперсет {supersetLetter(block.superset)}
          </Eyebrow>
        </div>
        <ol className='min-w-0 [&>li:last-child]:border-b-0'>{rows}</ol>
      </li>
    )
  })
}
