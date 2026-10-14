import { ChevronRightIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'

import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

export type MuscleLoadItem = { muscleId?: number; name: string; sets: number; forgotten?: boolean }

type MuscleLoadProps = {
  items: MuscleLoadItem[]
  title?: string
  /** Куда ведёт мышца: прогресс весов по ней. Без него строки не нажимаются (превью) */
  linkTo?: (item: MuscleLoadItem) => string
}

// Нагрузка по мышцам за неделю: полосы в подходах, забытые группы заштрихованы
export const MuscleLoad = ({ items, title = 'Нагрузка по мышцам', linkTo }: MuscleLoadProps) => {
  const max = Math.max(...items.map(m => m.sets), 1)
  const rowClass = cn('grid items-center gap-3', linkTo ? 'grid-cols-[84px_1fr_44px_16px]' : 'grid-cols-[84px_1fr_44px]')
  return (
    <ScreenSection
      title={title}
      aside='подходов за неделю'
    >
      <ul className='flex flex-col gap-2'>
        {items.map((m, i) => (
          <MuscleRow
            key={m.name}
            to={linkTo?.(m)}
            className={rowClass}
            title={`${m.name}: ${m.sets} подх.`}
          >
            <Text
              as='span'
              size='sm'
              tone={m.forgotten ? 'muted' : 'inherit'}
            >
              {m.name}
            </Text>
            {m.forgotten ? (
              <span className='hatch border-foreground/30 text-foreground/70 flex h-6 items-center border border-dashed px-2'>
                <Eyebrow
                  size='sm'
                  tone='inherit'
                  className='bg-background px-1'
                >
                  забыто
                </Eyebrow>
              </span>
            ) : (
              <span className='h-6'>
                <motion.span
                  className='bg-primary block h-full rounded-r-[4px]'
                  initial={{ width: 0 }}
                  animate={{ width: `${(m.sets / max) * 100}%` }}
                  transition={{ delay: 0.25 + i * 0.05, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                />
              </span>
            )}
            <Poster
              as='span'
              size='sm'
              className='text-right'
            >
              {m.sets.toString().replace('.', ',')}
            </Poster>
            {linkTo && <ChevronRightIcon className='text-foreground/40 size-4' />}
          </MuscleRow>
        ))}
      </ul>
    </ScreenSection>
  )
}

type MuscleRowProps = { to?: string; className: string; title: string; children: ReactNode }

// Строка мышцы: со ссылкой — вся строка нажимается и ведёт на прогресс весов
const MuscleRow = ({ to, className, title, children }: MuscleRowProps) => (
  <li title={title}>
    {to ? (
      <Link
        to={to}
        className={cn(className, '-mx-1 px-1 py-0.5 active:bg-foreground/5')}
      >
        {children}
      </Link>
    ) : (
      <div className={className}>{children}</div>
    )}
  </li>
)
