import { Undo2Icon } from 'lucide-react'
import { AnimatePresence, motion, type PanInfo, useReducedMotion } from 'motion/react'

import { type RefObject, useRef, useState, useSyncExternalStore } from 'react'

import { haptic } from '@/shared/miniapp'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { useScreenChrome } from './screen-chrome'
import { Text } from './Typography'
import { undoBar, type UndoItem } from './undo-bar'

/** Смахнули дальше — плашка уходит без отмены */
const SWIPE_AWAY = 80

// Отмена последней правки: чёрная плашка у большого пальца, над нижним меню.
// Снизу тает дорожка — видно, сколько осталось до отправки.
// Подключается один раз в оболочке; показывают её через undoBar.show
export const UndoBar = () => {
  const item = useSyncExternalStore(undoBar.subscribe, undoBar.get)
  const { navVisible } = useScreenChrome()
  const still = useReducedMotion()
  const hidden = still ? { opacity: 0 } : { opacity: 0, y: 24 }
  // Смахивание, начатое на «Отменить», заканчивается кликом по ней — без флага плашка отменяла правку, а не уходила
  const dragged = useRef(false)

  return (
    <div
      className={
        // Над меню, если оно есть, иначе над нижним краем телефона
        navVisible
          ? 'pointer-events-none fixed inset-x-0 bottom-[calc(var(--sb-nav-h)+0.75rem)] z-[48] mx-auto max-w-[440px] px-gutter'
          : 'pointer-events-none fixed inset-x-0 bottom-[max(1rem,var(--sb-bottom-inset))] z-[48] mx-auto max-w-[440px] px-gutter'
      }
    >
      <AnimatePresence>
        {item && (
          <motion.div
            key={item.id}
            role='status'
            aria-live='polite'
            initial={hidden}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={hidden}
            transition={still ? { duration: 0.15 } : { type: 'spring', stiffness: 520, damping: 36 }}
            drag={still ? false : 'x'}
            dragSnapToOrigin
            dragElastic={0.6}
            onPointerDownCapture={() => (dragged.current = false)}
            onDragStart={() => (dragged.current = true)}
            onDragEnd={(_, info: PanInfo) => Math.abs(info.offset.x) > SWIPE_AWAY && undoBar.close(item.id)}
            className='pointer-events-auto mr-[3px] mb-[3px] touch-pan-y'
          >
            <Plate item={item} dragged={dragged} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const Plate = ({ item, dragged }: { item: UndoItem; dragged: RefObject<boolean> }) => {
  // Плашка могла смонтироваться не в момент показа: дорожка стартует с уже прошедшей доли
  const [lane] = useState(() => {
    const rest = Math.max(0, item.startedAt + item.timeout - Date.now())
    return { from: rest / item.timeout, duration: rest / 1000 }
  })

  return (
    <div className='bg-foreground text-background relative flex items-center gap-3 overflow-hidden py-2.5 pr-2.5 pl-4 shadow-[3px_3px_0_var(--sb-blue)]'>
      <div className='sb-lanes pointer-events-none absolute inset-0 opacity-[0.1]' />

      <Text
        as='span'
        size='sm'
        className='relative min-w-0 flex-1 leading-tight font-medium'
      >
        {item.title}
      </Text>

      <Button
        variant='paper'
        size='sm'
        className='relative shrink-0'
        onClick={() => {
          if (dragged.current) return
          haptic.tap()
          undoBar.undo(item.id)
        }}
      >
        <Undo2Icon strokeWidth={2.5} />
        Отменить
      </Button>

      {/* Дорожка тает до нуля за всё время плашки */}
      <motion.span
        aria-hidden
        initial={{ scaleX: lane.from }}
        animate={{ scaleX: 0 }}
        transition={{ duration: lane.duration, ease: 'linear' }}
        className='bg-primary absolute inset-x-0 bottom-0 h-[3px] origin-left'
      />
    </div>
  )
}
