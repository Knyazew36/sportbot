import { motion, useReducedMotion } from 'motion/react'

import { cn } from '@/shared/lib/utils'

import { Poster } from './Typography'

export type ChargeLink = {
  label: string
  /** Заряд звена 0..1: доля сделанных подходов или пройденный шаг круга */
  charge: number
  state: 'done' | 'current' | 'idle'
}

type ChargeChainProps = {
  links: ChargeLink[]
  /** Тап по звену: пагинация ленты карточек */
  onPick?: (index: number) => void
  /** Меняется — цепочка вспыхивает и звенья защёлкиваются: круг закрыт */
  burstKey?: string | number
  className?: string
}

// Цепочка суперсета: звенья заряжаются синим по ходу круга, заряд перетекает в следующее звено.
// Одна и та же на экране суперсета, в фокусе круга и на отдыхе — суперсет узнаётся по ней везде
export const ChargeChain = ({ links, onPick, burstKey, className }: ChargeChainProps) => {
  const still = useReducedMotion()
  return (
    <motion.ol
      key={burstKey}
      className={cn('flex items-center', className)}
      // Вспышка круга: короткий удар яркостью и масштабом, без неё закрытие круга теряется
      initial={still || burstKey === undefined ? false : { scale: 1.08, filter: 'brightness(1.6)' }}
      animate={{ scale: 1, filter: 'brightness(1)' }}
      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
    >
      {links.map((link, i) => {
        const Tag = onPick ? 'button' : 'span'
        return (
          <li
            key={link.label}
            className='flex min-w-0 flex-1 items-center'
          >
            {/* Сцепка между звеньями: заряжена, когда предыдущее звено пройдено */}
            {i > 0 && (
              <span
                aria-hidden
                className='bg-foreground/15 relative h-[3px] w-3 shrink-0 overflow-hidden'
              >
                <motion.span
                  className='bg-primary absolute inset-0 origin-left'
                  initial={false}
                  animate={{ scaleX: links[i - 1]!.state === 'done' ? 1 : 0 }}
                  transition={still ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
                />
              </span>
            )}
            <Tag
              {...(onPick ? { type: 'button' as const, onClick: () => onPick(i) } : {})}
              className={cn(
                // Пройденное звено узнаётся по полной заливке: галочка рядом с меткой не влезала в пять звеньев на 360px
                'relative flex h-8 min-w-0 flex-1 items-center justify-center overflow-hidden border-[1.5px]',
                link.state === 'current' ? 'border-primary border-2' : 'border-foreground/25',
              )}
              aria-current={link.state === 'current' ? 'step' : undefined}
            >
              <motion.span
                aria-hidden
                className='bg-primary absolute inset-0 origin-left'
                initial={false}
                animate={{ scaleX: Math.min(1, Math.max(0, link.charge)) }}
                transition={still ? { duration: 0 } : { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
              />
              {/* Текущее звено «дышит», пока заряд не дошёл: видно, где сейчас круг */}
              {link.state === 'current' && !still && (
                <motion.span
                  aria-hidden
                  className='bg-primary/25 absolute inset-0'
                  animate={{ opacity: [0.2, 0.8, 0.2] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <Poster
                as='span'
                size='xs'
                tone='inherit'
                // Светлая метка только на полностью залитом звене: на половинной заливке она терялась
                className={cn('relative', link.charge >= 1 ? 'text-primary-foreground' : 'text-foreground')}
              >
                {link.label}
              </Poster>
            </Tag>
          </li>
        )
      })}
    </motion.ol>
  )
}
