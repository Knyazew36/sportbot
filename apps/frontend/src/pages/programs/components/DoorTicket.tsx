import { ArrowRightIcon } from 'lucide-react'
import { Link } from 'react-router'

import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import { haptic } from '@/shared/miniapp'
import { Poster, Text } from '@/shared/ui/kit/Typography'

const STUB_TONE = {
  ink: 'bg-foreground text-background',
  blue: 'bg-primary text-primary-foreground',
  draft: 'text-foreground',
} as const

type DoorTicketProps = {
  /** Крупный знак на корешке: число или значок */
  mark: ReactNode
  title: ReactNode
  meta: ReactNode
  /** Цвет корешка: draft — пунктирный билет ещё не созданной программы, как «Новая тренировка» в очереди */
  tone: keyof typeof STUB_TONE
  /** Адрес перехода; без него билет — кнопка с onClick */
  to?: string
  onClick?: () => void
  disabled?: boolean
}

// Переход к другой программе — горизонтальный билет: тот же язык, что у очереди тренировок выше.
// Цветной корешок и тень делают строку заметной, а тень к тому же говорит «сюда можно тыкать»
export const DoorTicket = ({ mark, title, meta, tone, to, onClick, disabled }: DoorTicketProps) => {
  const classes = cn(
    'border-foreground bg-card relative mr-[3px] mb-[3px] flex items-stretch border-[1.5px] text-left shadow-[3px_3px_0_var(--sb-ink)] transition-[translate,box-shadow] duration-100 outline-none focus-visible:ring-4 focus-visible:ring-ring/25 active:translate-[3px] active:shadow-none disabled:opacity-60',
    tone === 'draft' && 'border-dashed',
  )
  const handleClick = () => {
    haptic.tap()
    onClick?.()
  }
  const content = (
    <>
      {/* Растровый угол — фирменная фактура плаката, гаснет к центру билета */}
      <span className='sb-halftone pointer-events-none absolute -top-2 -right-2 size-16 opacity-30 [mask-image:radial-gradient(circle_at_top_right,black,transparent_70%)]' />
      <span
        className={cn(
          'border-foreground flex w-[72px] shrink-0 items-center justify-center border-r-[1.5px] border-dashed py-4',
          STUB_TONE[tone],
        )}
      >
        <Poster
          as='span'
          size='xl'
          numeric
        >
          {mark}
        </Poster>
      </span>
      {/* Вырезы линии отрыва: сверху и снизу, как корешок у билетов очереди */}
      <span className='bg-background border-foreground absolute -top-[7px] left-[65px] size-3 rounded-full border-[1.5px]' />
      <span className='bg-background border-foreground absolute -bottom-[7px] left-[65px] size-3 rounded-full border-[1.5px]' />
      <span className='relative flex min-w-0 flex-1 flex-col justify-center gap-1 py-3 pr-2 pl-4'>
        <Poster
          as='span'
          size='sm'
        >
          {title}
        </Poster>
        <Text
          as='span'
          size='xs'
          tone='muted'
        >
          {meta}
        </Text>
      </span>
      <ArrowRightIcon
        className='relative mr-3 size-5 shrink-0 self-center'
        strokeWidth={2.5}
      />
    </>
  )

  if (to)
    return (
      <Link
        to={to}
        className={classes}
        onClick={handleClick}
      >
        {content}
      </Link>
    )

  return (
    <button
      type='button'
      className={classes}
      disabled={disabled}
      onClick={handleClick}
    >
      {content}
    </button>
  )
}
