import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography'

import { FocusScoreboard, type FocusSets } from './FocusScoreboard'

type FocusShellProps = {
  /** Что происходит: «идёт подход», «пауза», «отдых» */
  status: string
  /** Акцентом, когда статус требует действия: пауза, отдых закончился */
  alert?: boolean
  /** Название упражнения; в круге суперсета — с анимацией смены */
  title: ReactNode
  /** Под названием: что будет дальше в круге суперсета */
  subtitle?: ReactNode
  /** Над названием: цепочка круга суперсета */
  above?: ReactNode
  /** Фон-дорожки едут: идёт круг суперсета */
  running?: boolean
  sets: FocusSets
  /** Начало тренировки — общее время на табло, пока шапка экрана упражнения закрыта */
  startedAt: string
  children: ReactNode
  /** Крупные кнопки внизу, под большой палец */
  actions: ReactNode
}

// Полный экран на время подхода и отдыха: только время и пара крупных кнопок — после подхода дрожат руки.
// Фон темы, а не чёрная плашка: в тёмной теме плашка светлая и слепила бы весь экран.
// Выше полоски под шапку мессенджера (z-40), ниже шторки ввода (z-50), чтобы «Закончил подход» открывал её поверх
export const FocusShell = ({
  status,
  alert,
  title,
  subtitle,
  above,
  running,
  sets,
  startedAt,
  children,
  actions,
}: FocusShellProps) => (
  <div className='bg-background fixed inset-0 z-[45] mx-auto flex max-w-[440px] flex-col'>
    <div className={cn('sb-lanes pointer-events-none absolute inset-0 opacity-[0.06]', running && 'sb-lanes-run opacity-[0.1]')} />
    {/* Название целиком, до двух строк: «Жим гантелей на наклонной…» с многоточием не отличить от соседнего упражнения */}
    <div className='relative flex flex-col gap-3 px-gutter pt-[calc(var(--sb-top-inset,0px)+1rem)]'>
      {above}
      <div>
        <Eyebrow
          as='p'
          tone={alert ? 'primary' : 'muted'}
        >
          {status}
        </Eyebrow>
        <Poster
          as='h1'
          size='md'
          className='mt-1 line-clamp-2 text-balance'
        >
          {title}
        </Poster>
        {subtitle}
      </div>
      <FocusScoreboard
        sets={sets}
        startedAt={startedAt}
      />
    </div>
    <div className='relative flex flex-1 flex-col items-center justify-center gap-6 px-gutter'>{children}</div>
    <div className='relative flex flex-col gap-3 px-gutter pb-[max(1.25rem,var(--sb-bottom-inset))]'>
      {actions}
    </div>
  </div>
)
