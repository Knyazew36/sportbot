import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { Poster } from './Typography'

type StampProps = {
  /** Текст штампа; null — штампа нет */
  text: string | null
}

// Штамп поверх экрана: «КРУГ 2 ✓», «СУПЕРСЕТ A ГОТОВ». Падает ударом, как печать на бланк, и сам уходит.
// Сквозной для пальца: под ним уже открывается шторка или следующий экран
export const Stamp = ({ text }: StampProps) => {
  const still = useReducedMotion()
  return (
    <div
      aria-live='polite'
      className='pointer-events-none fixed inset-0 z-[46] flex items-center justify-center px-gutter'
    >
      <AnimatePresence>
        {text && (
          <motion.div
            key={text}
            initial={still ? { opacity: 0 } : { opacity: 0, scale: 2.4, rotate: -14 }}
            animate={{ opacity: 1, scale: 1, rotate: -6 }}
            exit={{ opacity: 0, scale: still ? 1 : 0.9 }}
            transition={still ? { duration: 0.15 } : { type: 'spring', stiffness: 520, damping: 22 }}
            className='border-primary bg-background/90 border-4 px-5 py-3 shadow-[6px_6px_0_var(--sb-blue)]'
          >
            <Poster
              as='p'
              size='2xl'
              tone='primary'
              className='text-center whitespace-nowrap'
            >
              {text}
            </Poster>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
