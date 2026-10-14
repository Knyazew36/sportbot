import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

import { Rise } from './Reveal'
import { Eyebrow, Poster } from './Typography'

type ScreenSectionProps = {
  title?: ReactNode
  /** Пояснение справа от заголовка: единицы, счётчик */
  aside?: ReactNode
  action?: ReactNode
  children: ReactNode
  /** Контент на всю ширину экрана — для горизонтальных лент */
  bleed?: boolean
  /**
   * label — лёгкая метка: секции экрана-плаката, где блоки и так разные по виду.
   * block — жирная линейка и плакатный заголовок: длинные экраны настроек и форм, где однотипные
   * блоки идут подряд и без явной шапки сливаются в одну кучу
   */
  variant?: 'label' | 'block'
  /** Порядковый номер блока — только для variant='block' */
  index?: number
  className?: string
}

// Секция экрана: заголовок и содержимое с полями экрана. Сама участвует во входной анимации Screen
export const ScreenSection = ({
  title,
  aside,
  action,
  children,
  bleed,
  variant = 'label',
  index,
  className,
}: ScreenSectionProps) => {
  if (variant === 'block') {
    return (
      <Rise className={cn('px-gutter', className)}>
        <section className='border-foreground flex flex-col gap-4 border-t-[3px] pt-3'>
          <header className='flex flex-wrap items-end justify-between gap-x-3 gap-y-1'>
            <div className='flex min-w-0 items-baseline gap-2.5'>
              {index != null && (
                <Poster
                  as='span'
                  size='lg'
                  tone='primary'
                  numeric
                >
                  {String(index).padStart(2, '0')}
                </Poster>
              )}
              <Poster
                as='h2'
                size='lg'
              >
                {title}
              </Poster>
            </div>
            {aside && <Eyebrow className='pb-0.5 text-right'>{aside}</Eyebrow>}
            {action}
          </header>
          {children}
        </section>
      </Rise>
    )
  }

  return (
    <Rise className={cn('flex flex-col gap-3', !bleed && 'px-gutter', className)}>
      {(title || aside || action) && (
        <div className={cn('flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1', bleed && 'px-gutter')}>
          {title && (
            <Eyebrow
              as='h2'
              tone='primary'
            >
              {title}
            </Eyebrow>
          )}
          {aside && <Eyebrow>{aside}</Eyebrow>}
          {action}
        </div>
      )}
      {children}
    </Rise>
  )
}
