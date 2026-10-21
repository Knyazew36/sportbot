import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router'

import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

import { Eyebrow, Poster, Text } from './Typography'

type NoticeProps = {
  /** Метка над заголовком: что это за подсказка */
  kicker?: ReactNode
  title?: ReactNode
  description?: ReactNode
  /** Компактное действие справа от текста — одна маленькая кнопка */
  action?: ReactNode
  /** Действия на всю ширину под текстом — когда кнопок несколько или подпись длинная */
  children?: ReactNode
  /** Весь блок — ссылка: шеврон справа вместо кнопки */
  to?: string
  className?: string
}

// Подсказка-напоминание: пропущенная заминка, забытые мышцы, пауза. Штриховка — только корешок слева:
// текст на сплошной штриховке читался пятнами и требовал подложек под каждую строку
export const Notice = ({ kicker, title, description, action, children, to, className }: NoticeProps) => {
  const body = (
    <>
      <span
        aria-hidden
        className='hatch border-border w-3 shrink-0 border-r-[1.5px]'
      />
      <div className='flex min-w-0 flex-1 flex-col gap-4 p-4'>
        <div className='flex items-center gap-3'>
          <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
            {kicker && <Eyebrow as='p'>{kicker}</Eyebrow>}
            {title && <Poster size='md'>{title}</Poster>}
            {description && (
              <Text
                size='sm'
                tone='soft'
              >
                {description}
              </Text>
            )}
          </div>
          {action && <div className='shrink-0'>{action}</div>}
          {to && <ChevronRightIcon className='text-foreground/40 size-5 shrink-0' />}
        </div>
        {children}
      </div>
    </>
  )

  const frame = cn('border-border bg-background flex border-[1.5px]', className)
  return to ? (
    <Link
      to={to}
      className={cn(frame, 'active:bg-foreground/5 transition-colors')}
    >
      {body}
    </Link>
  ) : (
    <div className={frame}>{body}</div>
  )
}
