import { ArrowRightIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTheme } from 'next-themes'
import { Link } from 'react-router'

import { type CSSProperties, useEffect } from 'react'

import { useCurrentWorkout, useQueuedWorkout } from '@/entities/workout'
import { ROUTES } from '@/shared/config/paths'
import { formatSeconds, useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer'
import { repaintMessengerChrome } from '@/shared/lib/hooks/use-messenger-theme'
import { useWorkoutElapsed } from '@/shared/lib/hooks/use-workout-elapsed'
import { haptic, setMessengerHeaderAccent } from '@/shared/miniapp'
import { LiveDot } from '@/shared/ui/kit/LiveDot'
import { Eyebrow } from '@/shared/ui/kit/Typography'

/** Высота полосы под отступом мессенджера: строка 44px и волна снизу */
const LIVE_H = '56px'

const INK = 'text-[color:var(--sb-live-ink)]'

// Тренировка идёт, а человек ушёл на другие экраны: зелёная полоса сверху возвращает к ней одним касанием.
// Во время отдыха полоса абрикосовая и считает остаток. Опускает всё, что прилипает к верху, через --sb-live-h,
// а в Telegram красит его шапку в тот же цвет
export const LiveWorkoutBar = () => {
  const current = useCurrentWorkout()
  const { workout, finishing } = useQueuedWorkout(current.data?.workout)
  // Завершение ждёт сети: возвращаться уже не к чему
  const live = workout && !finishing ? workout : null
  const visible = Boolean(live)
  const { resolvedTheme } = useTheme()
  // Тот же таймер, что на экране тренировки: дедлайн в localStorage. На экране тренировки полосы нет, при уходе
  // с него она монтируется заново и читает таймер свежим. Без onEnd — сигнал конца отдыха подаёт экран тренировки
  const timer = useDeadlineTimer({ storageKey: live ? `rest-timer-${live.id}` : undefined })
  const resting = visible && timer.status === 'running' && timer.left > 0

  useEffect(() => {
    if (!visible) return
    const root = document.documentElement
    root.style.setProperty('--sb-live-h', LIVE_H)
    return () => {
      root.style.removeProperty('--sb-live-h')
    }
  }, [visible])

  // Цвет берём из CSS после кадра, а не константой: палитра живёт в global.css.
  // Тема в зависимостях — её перекраска иначе вернула бы шапке цвет бумаги
  useEffect(() => {
    if (!visible) return
    const frame = requestAnimationFrame(() => {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue(resting ? '--sb-rest' : '--sb-live')
        .trim()
      setMessengerHeaderAccent(color || null)
      repaintMessengerChrome()
    })
    return () => {
      cancelAnimationFrame(frame)
      setMessengerHeaderAccent(null)
      repaintMessengerChrome()
    }
  }, [visible, resting, resolvedTheme])

  return (
    <AnimatePresence>
      {live && (
        <LiveStrip
          key='live'
          complexName={live.complexName}
          startedAt={live.startedAt}
          restLeft={resting ? timer.left : null}
        />
      )}
    </AnimatePresence>
  )
}

type LiveStripProps = {
  complexName: string
  startedAt: string
  /** Идёт отдых: полоса абрикосовая, справа остаток отдыха вместо общего времени */
  restLeft: number | null
}

// Цвета отдыха подменяют мятные прямо на полосе: заливка и волны берут их из --sb-live*
const REST_COLORS = { '--sb-live': 'var(--sb-rest)', '--sb-live-deep': 'var(--sb-rest-deep)' } as CSSProperties

const LiveStrip = ({ complexName, startedAt, restLeft }: LiveStripProps) => {
  const still = useReducedMotion()
  const elapsed = useWorkoutElapsed(startedAt)
  const hidden = still ? { opacity: 0 } : { y: '-100%' }

  return (
    <motion.div
      initial={hidden}
      animate={{ y: 0, opacity: 1 }}
      exit={hidden}
      transition={still ? { duration: 0.2 } : { type: 'spring', stiffness: 380, damping: 34 }}
      style={restLeft !== null ? REST_COLORS : undefined}
      // Тень повторяет волну: drop-shadow идёт по маске, а не по прямоугольнику
      className='fixed inset-x-0 top-0 z-[45] mx-auto h-(--sb-top-inset) max-w-[440px] drop-shadow-[0_4px_6px_rgb(10_10_10/0.12)]'
    >
      <Link
        to={ROUTES.WORKOUT}
        onClick={haptic.tap}
        aria-label={`Вернуться к тренировке: ${complexName}`}
        className={`relative block h-full ${INK}`}
      >
        {/* Две волны с разным шагом и встречным ходом: задняя темнее и выглядывает из-под передней.
            Тело и передняя волна заходят друг на друга на 1px, чтобы на дробных пикселях не было щели */}
        <span
          aria-hidden
          className='sb-wave-back absolute inset-x-0 bottom-0 h-3 bg-(--sb-live-deep) motion-reduce:animate-none'
        />
        <LiveFill className='inset-x-0 top-0 bottom-3' />
        <LiveFill className='sb-wave-front inset-x-0 bottom-[3px] h-2.5 motion-reduce:animate-none' />
        <motion.span
          whileTap={{ scale: 0.985, opacity: 0.8 }}
          className='absolute inset-x-0 bottom-3 flex h-11 min-w-0 items-center gap-2.5 px-gutter'
        >
          <LiveDot className={`size-2 ${INK}`} />
          <Eyebrow className={`min-w-0 flex-1 truncate font-medium ${INK}`}>{complexName}</Eyebrow>
          <Eyebrow className={`shrink-0 tabular-nums ${INK}`}>
            {restLeft !== null ? `отдых ${formatSeconds(restLeft)}` : elapsed}
          </Eyebrow>
          <ArrowRightIcon
            aria-hidden
            className='size-4 shrink-0'
            strokeWidth={2.5}
          />
        </motion.span>
      </Link>
    </motion.div>
  )
}

// Мятная заливка с переливом и бликом. Одинакова у тела полосы и у волны, поэтому они читаются одним целым
const LiveFill = ({ className }: { className: string }) => (
  <span
    aria-hidden
    className={`absolute overflow-hidden ${className}`}
  >
    <span className='sb-live-breath absolute inset-0 motion-reduce:animate-none' />
    <span className='sb-live-sheen absolute inset-y-0 left-0 w-1/2 motion-reduce:hidden' />
  </span>
)
