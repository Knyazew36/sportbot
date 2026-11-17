import { type RefObject, useEffect, useRef } from 'react'

import type { SupportLocale } from '../locale'

// Короткий набор под переписку с клиентом: полный каталог эмодзи с поиском тут лишний вес
const EMOJIS = [
  '😀',
  '😃',
  '😄',
  '😁',
  '😊',
  '🙂',
  '😉',
  '😍',
  '🥰',
  '😘',
  '😎',
  '🤗',
  '🤔',
  '😅',
  '😂',
  '🤣',
  '😇',
  '😌',
  '😐',
  '🙄',
  '😔',
  '😢',
  '😭',
  '😱',
  '😡',
  '🥺',
  '😴',
  '🤝',
  '👍',
  '👎',
  '👌',
  '✌️',
  '🙏',
  '👏',
  '🙌',
  '💪',
  '👋',
  '🤞',
  '✅',
  '❌',
  '❗',
  '❓',
  '⚠️',
  '⏳',
  '📦',
  '🚚',
  '📞',
  '✉️',
  '🔥',
  '⭐',
  '🎉',
  '💡',
  '❤️',
  '💙',
  '💚',
  '💯',
]

interface EmojiPickerProps {
  locale: SupportLocale
  onPick: (emoji: string) => void
  onClose: () => void
  /** Кнопка, открывающая окно: клик по ней не считается «мимо», иначе окно тут же откроется заново. */
  anchorRef: RefObject<HTMLElement | null>
}

/** Всплывающая сетка эмодзи над полем ввода; закрывается кликом мимо или Escape. */
export const EmojiPicker = ({ locale, onPick, onClose, anchorRef }: EmojiPickerProps) => {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || anchorRef.current?.contains(target)) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    // capture — чтобы Escape не долетел до окна чата и не закрыл его
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [onClose, anchorRef])

  return (
    <div
      ref={rootRef}
      role='dialog'
      aria-label={locale.emoji}
      className='scw:absolute scw:bottom-full scw:left-3 scw:z-10 scw:mb-1 scw:grid scw:grid-cols-8 scw:gap-0.5 scw:rounded-ui scw:border scw:border-border scw:bg-bg scw:p-1.5 scw:shadow-panel'
    >
      {EMOJIS.map(emoji => (
        <button
          key={emoji}
          type='button'
          className='scw:inline-flex scw:size-8 scw:cursor-pointer scw:items-center scw:justify-center scw:rounded-lg scw:text-xl scw:leading-none scw:transition-colors scw:hover:bg-surface'
          onClick={() => onPick(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
