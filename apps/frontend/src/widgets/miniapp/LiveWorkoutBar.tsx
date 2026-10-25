import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTheme } from 'next-themes'
import { Link } from 'react-router'

import { type CSSProperties, useEffect } from 'react'

import { useCurrentWorkout, useQueuedWorkout } from '@sportbot/api/entities/workout'
import { ROUTES } from '@/shared/config/paths'
import { useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer'
import { repaintMessengerChrome } from '@/shared/lib/hooks/use-messenger-theme'
import { haptic, setMessengerHeaderAccent } from '@/shared/miniapp'

/** Высота полосы под отступом мессенджера: тонкая заливка 6px и волна 10px. Без текста — цвет сам говорит, что идёт тренировка */
const LIVE_H = '16px'

// Тренировка идёт, а человек ушёл на другие экраны: зелёная полоса сверху возвращает к ней одним касанием.
// Во время отдыха полоса абрикосовая. Опускает всё, что прилипает к верху, через --sb-live-h,
// а в Telegram красит его шапку в тот же цвет
export const LiveWorkoutBar = ({ onReturn }: LiveWorkoutBarProps) => {
  const current = useCurrentWorkout()
  const { workout, finishing } = useQueuedWorkout(current.data?.workout)
  // Завершение ждёт сети: возвращаться уже не к чему
  const live = workout && !finishing ? workout : null
  const visible = Boolean(live)
  const { resolvedTheme } = useTheme()
  // Тот же таймер, что на экране тренировки: дедлайн в localStorage. Полоса монтируется заново при уходе с фокуса
  // и с экрана тренировки, поэтому читает таймер свежим. Без onEnd — сигнал конца отдыха подаёт экран тренировки
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
          resting={resting}
          onReturn={onReturn}
        />
      )}
    </AnimatePresence>
  )
}

type LiveWorkoutBarProps = {
  /** На экране тренировки: тап возвращает в свёрнутый фокус, а не ведёт по ссылке на этот же экран */
  onReturn?: () => void
}

type LiveStripProps = LiveWorkoutBarProps & {
  complexName: string
  /** Идёт отдых: полоса абрикосовая */
  resting: boolean
}

// Цвета отдыха подменяют мятные прямо на полосе: заливка и волны берут их из --sb-live*
const REST_COLORS = { '--sb-live': 'var(--sb-rest)', '--sb-live-deep': 'var(--sb-rest-deep)' } as CSSProperties

const LiveStrip = ({ complexName, resting, onReturn }: LiveStripProps) => {
  const still = useReducedMotion()
  const hidden = still ? { opacity: 0 } : { y: '-100%' }

  return (
    <motion.div
      initial={hidden}
      animate={{ y: 0, opacity: 1 }}
      exit={hidden}
      transition={still ? { duration: 0.2 } : { type: 'spring', stiffness: 380, damping: 34 }}
      style={resting ? REST_COLORS : undefined}
      // Тень повторяет волну: drop-shadow идёт по маске, а не по прямоугольнику
      className='fixed inset-x-0 top-0 z-[45] mx-auto h-(--sb-top-inset) max-w-[440px] drop-shadow-[0_4px_6px_rgb(10_10_10/0.12)]'
    >
      {onReturn ? (
        <button
          type='button'
          onClick={() => {
            haptic.tap()
            onReturn()
          }}
          aria-label={`Вернуться к тренировке: ${complexName}`}
          className='relative block h-full w-full active:opacity-80'
        >
          <StripWaves />
        </button>
      ) : (
        <Link
          to={ROUTES.WORKOUT}
          onClick={haptic.tap}
          aria-label={`Вернуться к тренировке: ${complexName}`}
          className='relative block h-full active:opacity-80'
        >
          <StripWaves />
        </Link>
      )}
    </motion.div>
  )
}

const StripWaves = () => (
  <>
    {/* Две волны с разным шагом и встречным ходом: задняя темнее и выглядывает из-под передней.
        Тело и передняя волна заходят друг на друга на 1px, чтобы на дробных пикселях не было щели */}
    <span
      aria-hidden
      className='sb-wave-back absolute inset-x-0 bottom-0 h-2.5 bg-(--sb-live-deep) motion-reduce:animate-none'
    />
    <LiveFill className='inset-x-0 top-0 bottom-2.5' />
    <LiveFill className='sb-wave-front inset-x-0 bottom-[2px] h-2 motion-reduce:animate-none' />
  </>
)

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
