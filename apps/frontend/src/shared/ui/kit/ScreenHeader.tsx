import { ChevronLeftIcon } from 'lucide-react'

import type { ReactNode } from 'react'

import { ButtonLink } from './ButtonLink'
import { Eyebrow, Poster } from './Typography'

type ScreenHeaderProps = {
  title: ReactNode
  aside?: ReactNode
  /** Действие справа вместо подписи */
  action?: ReactNode
}

// Шапка раздела, как выходные данные газеты: слева раздел синим, справа контекст или кнопка
export const ScreenHeader = ({ title, aside, action }: ScreenHeaderProps) => (
  <header className='border-border px-gutter flex items-center justify-between gap-3 border-b-[1.5px] pt-5 pb-3'>
    <Eyebrow tone='primary'>{title}</Eyebrow>
    {action ?? (aside && <Eyebrow className='text-right'>{aside}</Eyebrow>)}
  </header>
)

type TopBarProps = {
  /** Куда ведёт «Назад» */
  back: string
  /** Что сделать при уходе назад, переход остаётся за ссылкой */
  onBack?: () => void
  title: ReactNode
  subtitle?: ReactNode
  /** Действие справа: «Завершить», «Готово», список */
  action?: ReactNode
}

// Шапка вложенного экрана: назад, заголовок, одно действие. Прилипает к верху при прокрутке
export const TopBar = ({ back, onBack, title, subtitle, action }: TopBarProps) => (
  <header className='border-border bg-background/90 px-gutter backdrop-blur-glass sticky top-(--sb-top-inset) z-30 grid grid-cols-[40px_1fr_auto] items-center gap-3 border-b-[1.5px] pt-2.5 pb-3'>
    <ButtonLink
      to={back}
      onClick={onBack}
      variant='outline'
      size='icon'
      aria-label='Назад'
    >
      <ChevronLeftIcon className='size-5' />
    </ButtonLink>
    <div className='min-w-0'>
      <Poster
        size='sm'
        truncate
      >
        {title}
      </Poster>
      {subtitle && (
        <Eyebrow
          as='p'
          className='mt-1 truncate'
        >
          {subtitle}
        </Eyebrow>
      )}
    </div>
    {action ?? <span className='size-10' />}
  </header>
)
