import { CheckIcon } from 'lucide-react'

import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { Poster, Text } from './Typography'

type OptionButtonProps = Omit<ComponentProps<typeof Button>, 'title' | 'variant' | 'size'> & {
  /** Буква комплекса или другой крупный знак слева */
  mark?: ReactNode
  title: string
  meta?: ReactNode
  /** Выбранный вариант залит и отмечен галочкой */
  selected?: boolean
}

// Кнопка-вариант в списке выбора: комплекс в шторке, программа при первом запуске.
// Название в одну строку с многоточием, подпись под ним отдельной строкой — не слипаются и не режутся
export const OptionButton = ({ mark, title, meta, selected, className, ...props }: OptionButtonProps) => (
  <Button
    variant={selected ? 'default' : 'outline'}
    size='lg'
    aria-pressed={selected}
    className={cn('h-auto min-h-[60px] w-full justify-start gap-4 py-2.5 text-left', className)}
    {...props}
  >
    {mark != null && (
      <Poster
        as='span'
        size='xl'
        className={cn('w-7 shrink-0 text-center', !selected && 'text-primary')}
      >
        {mark}
      </Poster>
    )}
    <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
      <Poster
        as='span'
        size='sm'
        truncate
      >
        {title}
      </Poster>
      {meta && (
        <Text
          as='span'
          size='2xs'
          className='truncate opacity-70'
        >
          {meta}
        </Text>
      )}
    </span>
    <CheckIcon
      className={cn('size-5 shrink-0', !selected && 'invisible')}
      strokeWidth={3}
    />
  </Button>
)
