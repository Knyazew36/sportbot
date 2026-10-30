import { motion, useReducedMotion } from 'motion/react'
import { useRef, useState } from 'react'

import { Poster } from '@/shared/ui/kit/Typography'

// Каждое нажатие — своя всплывашка: при быстрых нажатиях они летят друг за другом, а не перезапускают одну
export const useTimeBumps = () => {
  const [bumps, setBumps] = useState<number[]>([])
  const bumpId = useRef(0)
  return {
    bumps,
    bump: () => {
      bumpId.current += 1
      setBumps(list => [...list, bumpId.current])
    },
    drop: (id: number) => setBumps(list => list.filter(item => item !== id)),
  }
}

type TimeBumpsProps = ReturnType<typeof useTimeBumps> & {
  label: string
  /** Цвет экрана, если он не синий: разминка */
  className?: string
}

// Над цифрами и вне потока: всплывашка не двигает таймер
export const TimeBumps = ({ bumps, drop, label, className }: TimeBumpsProps) => {
  const still = useReducedMotion()
  return (
    <div className='pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2'>
      {bumps.map(id => (
        <motion.div
          key={id}
          className='absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap'
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: [0, 1, 1, 0], y: still ? 0 : -56, scale: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut', times: [0, 0.15, 0.6, 1] }}
          onAnimationComplete={() => drop(id)}
        >
          <Poster
            size='lg'
            tone='primary'
            numeric
            className={className}
          >
            {label}
          </Poster>
        </motion.div>
      ))}
    </div>
  )
}
