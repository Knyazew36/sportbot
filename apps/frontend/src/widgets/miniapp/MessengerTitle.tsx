import { useMessengerFullscreen } from '@/shared/lib/hooks/use-messenger-fullscreen'

// Telegram на весь экран прячет свою шапку с названием: остаются «Назад» слева и «Свернуть»/меню справа.
// Ставим между ними плашку с аватаркой и названием — тем же полупрозрачным овалом, что и кнопки Telegram.
// Ряд кнопок — полоса --tg-content-safe-area-inset-top под вырезом телефона (--tg-safe-area-inset-top),
// плашка центрируется в нём. Только подпись: нажатия проходят сквозь неё. Монтируется в FocusShell — только в фокус-режиме
export const MessengerTitle = () => {
  const fullscreen = useMessengerFullscreen()
  if (!fullscreen) return null

  return (
    <div
      aria-hidden
      className='pointer-events-none fixed inset-x-0 top-(--tg-safe-area-inset-top,0px) z-[46] flex h-(--tg-content-safe-area-inset-top,0px) items-center justify-center'
    >
      <div className='flex h-7 max-w-[45vw] items-center gap-1.5 rounded-full bg-black/30 py-[3px] pr-3 pl-[3px] text-white backdrop-blur-md dark:bg-black/45'>
        <svg
          viewBox='0 0 512 512'
          className='size-[22px] shrink-0 rounded-full'
        >
          <rect
            width='512'
            height='512'
            fill='#d1ffca'
          />
          <path
            d='M205 172L361 264L205 356Z'
            fill='#006eff'
          />
          <path
            d='M189 156L345 248L189 340Z'
            fill='#0a0a0a'
          />
        </svg>
        {/* Шрифт системный, как у соседних кнопок Telegram, а не фирменный */}
        <span className='truncate font-[system-ui,-apple-system,Roboto,sans-serif] text-[13px] leading-none font-semibold'>
          СпортБот
        </span>
      </div>
    </div>
  )
}
