import type { ReactNode } from 'react'

import { Eyebrow, Poster } from '@/shared/ui/kit/Typography'

type FocusShellProps = {
  title: string
  caption: ReactNode
  children: ReactNode
  /** Крупные кнопки внизу, под большой палец */
  actions: ReactNode
}

// Полный экран на время подхода и отдыха: только время и пара крупных кнопок — после подхода дрожат руки.
// Фон темы, а не чёрная плашка: в тёмной теме плашка светлая и слепила бы весь экран.
// Выше полоски под шапку мессенджера (z-40), ниже шторки ввода (z-50), чтобы «Закончил подход» открывал её поверх
export const FocusShell = ({ title, caption, children, actions }: FocusShellProps) => (
  <div className='bg-background fixed inset-0 z-[45] mx-auto flex max-w-[440px] flex-col'>
    <div className='sb-lanes pointer-events-none absolute inset-0 opacity-[0.06]' />
    <div className='relative px-gutter pt-[calc(var(--sb-top-inset,0px)+1.25rem)]'>
      <Poster
        size='md'
        className='truncate'
      >
        {title}
      </Poster>
      <Eyebrow
        as='p'
        className='mt-1'
      >
        {caption}
      </Eyebrow>
    </div>
    <div className='relative flex flex-1 flex-col items-center justify-center gap-6 px-gutter'>{children}</div>
    <div className='relative flex flex-col gap-3 px-gutter pb-[max(1.25rem,env(safe-area-inset-bottom))]'>
      {actions}
    </div>
  </div>
)
