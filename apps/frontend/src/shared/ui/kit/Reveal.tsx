import { motion, type Variants } from 'motion/react'

import type { ReactNode } from 'react'

const container: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 30 } },
}

// Один оркестрованный вход экрана вместо разрозненных анимаций
export const Stagger = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div
    className={className}
    variants={container}
    initial='hidden'
    animate='shown'
  >
    {children}
  </motion.div>
)

export const Rise = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <motion.div
    className={className}
    variants={item}
  >
    {children}
  </motion.div>
)
