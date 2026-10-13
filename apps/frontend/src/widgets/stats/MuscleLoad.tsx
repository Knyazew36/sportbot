import { motion } from 'motion/react'

import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

export type MuscleLoadItem = { name: string; sets: number; forgotten?: boolean }

// Нагрузка по мышцам за неделю: полосы в подходах, забытые группы заштрихованы
export const MuscleLoad = ({ items, title = 'Нагрузка по мышцам' }: { items: MuscleLoadItem[]; title?: string }) => {
  const max = Math.max(...items.map(m => m.sets), 1)
  return (
    <ScreenSection
      title={title}
      aside='подходов за неделю'
    >
      <ul className='flex flex-col gap-2'>
        {items.map((m, i) => (
          <li
            key={m.name}
            className='grid grid-cols-[84px_1fr_44px] items-center gap-3'
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
          </li>
        ))}
      </ul>
    </ScreenSection>
  )
}
