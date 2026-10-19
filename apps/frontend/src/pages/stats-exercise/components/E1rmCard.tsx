import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon, ChevronRightIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import type { StatsE1rmSetResponseDto } from '@/shared/api/generated/model'
import { cn } from '@/shared/lib/utils'
import { haptic } from '@/shared/miniapp'
import { Eyebrow, Lead, Poster, Unit } from '@/shared/ui/kit/Typography'

import { kg, ROUGH_REPS } from './E1rmSheet'

type E1rmCardProps = {
  e1rm: StatsE1rmSetResponseDto
  /** «лучший за 3 месяца» или «по последней тренировке» */
  label: string
  /** Изменение оценки за период, кг; null — точек меньше двух, направления нет */
  trend: number | null
  /** «за 3 месяца» */
  periodText: string
  onOpen: () => void
}

/** Меньше полкило — шум округления, а не движение */
const FLAT_KG = 0.5

// Куда идёт оценка: вверх — синим, вниз — красным, на месте — серым. Сразу на талоне, без открытия шторки
const Trend = ({ trend, periodText }: { trend: number; periodText: string }) => {
  const dir = trend >= FLAT_KG ? 'up' : trend <= -FLAT_KG ? 'down' : 'flat'
  const Icon = dir === 'up' ? ArrowUpRightIcon : dir === 'down' ? ArrowDownRightIcon : ArrowRightIcon
  return (
    <span
      className={cn(
        'flex shrink-0 flex-col items-end',
        dir === 'up' ? 'text-primary' : dir === 'down' ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      <span className='flex items-center gap-0.5'>
        <Icon
          className='size-6'
          strokeWidth={2.5}
        />
        <Poster
          as='span'
          size='sm'
          numeric
        >
          {dir === 'flat' ? '0' : `${trend > 0 ? '+' : '−'}${kg(Math.abs(trend))}`}
        </Poster>
      </span>
      <Eyebrow
        size='sm'
        tone='inherit'
      >
        {dir === 'flat' ? 'на месте' : 'кг'} {periodText}
      </Eyebrow>
    </span>
  )
}

// Расчётный 1ПМ — не замер, а оценка, и выглядит как отрывной талон, а не как кнопка или факт:
// пунктир вместо сплошной рамки, штрихованный корешок, курсив-антиква «расчётный» и штамп «оценка».
// Синяя тень — нажимается (открывает объяснение), но не путается с обычными чёрными кнопками
export const E1rmCard = ({ e1rm, label, trend, periodText, onOpen }: E1rmCardProps) => {
  const still = useReducedMotion()

  return (
    <button
      type='button'
      onClick={() => {
        haptic.tap()
        onOpen()
      }}
      className='border-primary relative mr-[3px] mb-[3px] grid w-full grid-cols-[16px_1fr] border-[1.5px] border-dashed bg-[var(--sb-tint)] text-left shadow-[3px_3px_0_var(--sb-blue)] transition-[translate,box-shadow] duration-100 outline-none focus-visible:ring-4 focus-visible:ring-ring/25 active:translate-[3px] active:shadow-none'
    >
      {/* Корешок талона: штриховка и линия отрыва */}
      <span
        aria-hidden
        className='hatch border-primary border-r-[1.5px] border-dashed'
      />
      <span className='flex min-w-0 flex-col gap-1 p-3 pr-4'>
        <Lead
          as='span'
          size='sm'
          tone='primary'
        >
          расчётный максимальный вес
        </Lead>
        <span className='flex items-end justify-between gap-3'>
          <Poster
            as='span'
            size='2xl'
            numeric
            fit
            className='min-w-0'
          >
            <span className='text-primary'>≈</span>
            {kg(e1rm.value)}
            <Unit>кг</Unit>
          </Poster>
          {trend != null && (
            <Trend
              trend={trend}
              periodText={periodText}
            />
          )}
        </span>
        <span className='flex items-end justify-between gap-3'>
          <Eyebrow
            size='sm'
            className='min-w-0'
          >
            {label} · из {kg(e1rm.weight)} кг × {e1rm.reps}
            {e1rm.reps > ROUGH_REPS && ' · грубо'}
          </Eyebrow>
          <Eyebrow
            size='sm'
            tone='primary'
            className='flex shrink-0 items-center'
          >
            как считается
            <ChevronRightIcon className='size-3.5' />
          </Eyebrow>
        </span>
      </span>
      {/* Штамп падает на талон один раз, как печать на бланк */}
      <motion.span
        aria-hidden
        initial={still ? { opacity: 0 } : { opacity: 0, scale: 2.2, rotate: -16 }}
        animate={{ opacity: 1, scale: 1, rotate: -7 }}
        transition={still ? { duration: 0.15 } : { type: 'spring', stiffness: 520, damping: 20, delay: 0.45 }}
        className='border-primary bg-background absolute -top-2.5 right-3 border-2 px-1.5 py-0.5'
      >
        <Poster
          as='span'
          size='xs'
          tone='primary'
          className='block tracking-[0.04em]'
        >
          на раз
        </Poster>
      </motion.span>
    </button>
  )
}
