import { motion, useReducedMotion } from 'motion/react'

// Лучи в два ряда, как деления кольца: длинные и короткие вперемешку
const RAYS = Array.from({ length: 24 }, (_, i) => ({ angle: (i / 24) * 360, long: i % 2 === 0 }))

type RestRaysProps = {
  /** Сторона квадрата кольца в единицах его viewBox — лучи стартуют от края делений */
  size?: number
}

// Отдых перед последним подходом окончен: от кольца волнами расходятся лучи — финишная прямая
export const RestRays = ({ size = 300 }: RestRaysProps) => {
  const still = useReducedMotion()
  const from = size / 2 + 4
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className='pointer-events-none absolute inset-0 size-full overflow-visible'
      aria-hidden
    >
      {RAYS.map(({ angle, long }) => (
        <g
          key={angle}
          transform={`translate(${size / 2} ${size / 2}) rotate(${angle})`}
        >
          <motion.line
            x1={from}
            x2={from + (long ? 16 : 9)}
            y1={0}
            y2={0}
            stroke='var(--sb-blue)'
            strokeWidth={long ? 3 : 2}
            strokeLinecap='round'
            initial={{ opacity: 0, x: 0 }}
            animate={still ? { opacity: long ? 0.8 : 0.5 } : { opacity: [0, 1, 0], x: [0, long ? 34 : 22] }}
            // Короткие отстают на полволны — расходится не один обруч, а рябь
            transition={
              still
                ? { duration: 0.3 }
                : { duration: 1.2, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.4, delay: long ? 0 : 0.6 }
            }
          />
        </g>
      ))}
    </svg>
  )
}
