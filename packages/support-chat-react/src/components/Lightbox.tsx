import { createPortal } from 'react-dom'

import { type TouchEvent, useEffect, useRef } from 'react'

import { cx } from '../cx'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, ExternalLinkIcon } from '../icons'
import type { SupportLocale } from '../locale'

export interface LightboxItem {
  key: string
  url: string
  name: string
}

export interface LightboxProps {
  items: LightboxItem[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
  locale: SupportLocale
}

const roundButton =
  'scw:inline-flex scw:items-center scw:justify-center scw:rounded-full scw:bg-white/8 scw:text-white scw:transition-colors scw:hover:bg-white/20'

// На телефоне листают свайпом — стрелки не заслоняют картинку
const navButton = cx(roundButton, 'scw:absolute scw:top-1/2 scw:size-12 scw:-translate-y-1/2 scw:max-[640px]:hidden')

/** Свайп короче — это не листание, а случайное движение пальца. */
const SWIPE_MIN_PX = 50

/**
 * Просмотр картинок диалога на весь экран: листание стрелками, клавишами ←/→ и свайпом,
 * закрытие — Esc, крестиком или кликом по фону. Через портал в body: окно чата обрезает
 * содержимое (overflow), а просмотрщик должен перекрыть всю страницу.
 */
export const Lightbox = ({ items, index, onIndexChange, onClose, locale }: LightboxProps) => {
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchX = useRef<number | null>(null)
  const item = items[index]
  const hasPrev = index > 0
  const hasNext = index < items.length - 1

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowLeft' && hasPrev) onIndexChange(index - 1)
      else if (event.key === 'ArrowRight' && hasNext) onIndexChange(index + 1)
      else return
      // Esc не должен заодно закрыть окно чата под просмотрщиком
      event.stopPropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [index, hasPrev, hasNext, onClose, onIndexChange])

  // Пока открыт просмотрщик, страница под ним не прокручивается
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Соседние картинки грузим заранее — листание без пустого экрана
  useEffect(() => {
    for (const neighbour of [items[index - 1], items[index + 1]]) {
      if (neighbour) new Image().src = neighbour.url
    }
  }, [items, index])

  if (!item) return null

  const onTouchEnd = (event: TouchEvent) => {
    const start = touchX.current
    touchX.current = null
    if (start === null) return
    const delta = event.changedTouches[0]!.clientX - start
    if (delta > SWIPE_MIN_PX && hasPrev) onIndexChange(index - 1)
    if (delta < -SWIPE_MIN_PX && hasNext) onIndexChange(index + 1)
  }

  return createPortal(
    <div
      className='scw-root scw:fixed scw:inset-0 scw:z-1000 scw:flex scw:animate-fade scw:touch-pan-y scw:items-center scw:justify-center scw:bg-[rgba(10,12,14,0.92)] scw:px-18 scw:py-14 scw:text-white scw:max-[640px]:px-2'
      role='dialog'
      aria-modal
      aria-label={item.name}
      onClick={event => event.target === event.currentTarget && onClose()}
      onTouchStart={event => (touchX.current = event.touches[0]!.clientX)}
      onTouchEnd={onTouchEnd}
    >
      <div className='scw:absolute scw:inset-x-0 scw:top-0 scw:flex scw:items-center scw:gap-1 scw:py-2.5 scw:pr-3 scw:pl-5'>
        <span className='scw:flex-1 scw:text-base scw:opacity-80'>
          {items.length > 1 && `${index + 1} ${locale.galleryOf} ${items.length}`}
        </span>
        <a
          className={cx(roundButton, 'scw:size-10')}
          href={item.url}
          target='_blank'
          rel='noreferrer'
          aria-label={locale.galleryOpen}
          title={locale.galleryOpen}
        >
          <ExternalLinkIcon />
        </a>
        <button
          ref={closeRef}
          type='button'
          className={cx(roundButton, 'scw:size-10')}
          aria-label={locale.galleryClose}
          title={locale.galleryClose}
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>

      {hasPrev && (
        <button
          type='button'
          className={cx(navButton, 'scw:left-3')}
          aria-label={locale.galleryPrev}
          onClick={() => onIndexChange(index - 1)}
        >
          <ChevronLeftIcon
            width={26}
            height={26}
          />
        </button>
      )}
      <img
        key={item.key}
        className='scw:max-h-full scw:max-w-full scw:animate-zoom scw:select-none scw:rounded-md scw:object-contain scw:shadow-[0_16px_64px_rgba(0,0,0,0.5)]'
        src={item.url}
        alt={item.name}
        onClick={event => event.stopPropagation()}
      />
      {hasNext && (
        <button
          type='button'
          className={cx(navButton, 'scw:right-3')}
          aria-label={locale.galleryNext}
          onClick={() => onIndexChange(index + 1)}
        >
          <ChevronRightIcon
            width={26}
            height={26}
          />
        </button>
      )}
    </div>,
    document.body,
  )
}
