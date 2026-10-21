import { motion, useReducedMotion } from 'motion/react'

import type { CooldownStretch } from '@/entities/workout'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

type MuscleCount = { name: string; count: number }

/** Больше строк экран-предложение не вмещает: кнопки в футере должны остаться видны без прокрутки */
const VISIBLE = 6

// Мышцы основного блока с числом растяжек на каждую: у растяжки они перечислены через запятую.
// Сначала самые проработанные — на них заминка и рассчитана
const countMuscles = (stretches: CooldownStretch[]): MuscleCount[] => {
  const counts = new Map<string, number>()
  for (const stretch of stretches)
    for (const raw of stretch.muscles.split(',')) {
      const name = raw.trim().toLowerCase()
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1)
    }
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
}

// Что растянет заминка: каждая мышца — дорожка, полоса тянется на столько, сколько на неё растяжек.
// Полосы «потягиваются» по очереди с упругим докатом — само движение и есть растяжка
export const StretchMuscles = ({ stretches }: { stretches: CooldownStretch[] }) => {
  const still = useReducedMotion()
  const muscles = countMuscles(stretches)
  if (!muscles.length) return null

  const shown = muscles.slice(0, VISIBLE)
  const rest = muscles.length - shown.length
  const max = shown[0]!.count

  return (
    <section className='border-foreground mt-6 border-t-[3px]'>
      <div className='flex items-baseline justify-between gap-3 py-2'>
        <Eyebrow as='h2'>Растянем то, что работало</Eyebrow>
        <span className='mono-label text-foreground/50 shrink-0'>
          {pluralize(muscles.length, ['мышца', 'мышцы', 'мышц'])}
        </span>
      </div>

      <ol>
        {shown.map((m, i) => (
          <li
            key={m.name}
            className='border-foreground/15 grid grid-cols-[1.75rem_minmax(0,1fr)_5.5rem_1.5rem] items-center gap-2 border-t py-2'
          >
            <span className='mono-label text-foreground/40'>{String(i + 1).padStart(2, '0')}</span>
            <Text className='truncate first-letter:uppercase'>{m.name}</Text>

            {/* Дорожка: разметка под полосой — сколько растяжек могло бы быть у самой проработанной мышцы */}
            <span
              aria-hidden
              className='bg-foreground/8 relative h-2.5 overflow-hidden'
            >
              <motion.span
                className='bg-primary absolute inset-y-0 left-0 origin-left'
                style={{ width: `${(m.count / max) * 100}%` }}
                initial={still ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.25 + i * 0.07 }}
              />
            </span>

            <Poster
              as='span'
              size='md'
              numeric
              className='text-right'
              aria-label={pluralize(m.count, ['растяжка', 'растяжки', 'растяжек'])}
            >
              {m.count}
            </Poster>
          </li>
        ))}
      </ol>

      {rest > 0 && (
        <Text
          size='sm'
          tone='soft'
          className='border-foreground/15 border-t pt-2'
        >
          и ещё {pluralize(rest, ['мышца', 'мышцы', 'мышц'])}
        </Text>
      )}
    </section>
  )
}
