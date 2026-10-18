import { ChevronRightIcon, type LucideIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Poster, Text } from '@/shared/ui/kit/Typography'

type SectionTicketProps = {
  to: string
  /** Номер раздела в корешке; без него — только значок (билет вне списка разделов) */
  index?: number
  icon: LucideIcon
  title: string
  meta?: string
  /** Состояние, о котором стоит помнить (пауза): синяя рамка и штриховка корешка */
  marked?: boolean
}

// Вырез на линии отрыва — тот же корешок, что у билетов комплексов и у карты участника
const Notch = ({ className }: { className: string }) => (
  <span
    className={cn('bg-background absolute -left-[7px] size-3 rounded-full border-[1.5px] border-current', className)}
  />
)

// Раздел профиля — билет: корешок с номером и значком, линия отрыва, справа название и сводка.
// Это кнопка: рамка, жёсткая тень и посадка на неё при нажатии, как у всех действий
export const SectionTicket = ({ to, index, icon: Icon, title, meta, marked }: SectionTicketProps) => (
  <ButtonLink
    to={to}
    variant={marked ? 'alert' : 'outline'}
    size='lg'
    className='h-auto w-full items-stretch justify-start gap-0 p-0 text-left whitespace-normal'
  >
    <span className={cn('flex w-[68px] shrink-0 flex-col items-center justify-center gap-2 py-3.5', marked && 'hatch')}>
      {index != null && (
        <Poster
          as='span'
          size='md'
          tone='primary'
          numeric
          className={cn(marked && 'bg-background px-1')}
        >
          {String(index).padStart(2, '0')}
        </Poster>
      )}
      {/* Без номера значок один держит корешок — крупнее */}
      <Icon className={cn(index != null ? 'size-5' : 'size-7', marked && 'bg-background')} />
    </span>

    <span className='relative w-0 border-l-[1.5px] border-dashed border-current/45'>
      <Notch className='-top-[7px]' />
      <Notch className='-bottom-[7px]' />
    </span>

    <span className='flex min-w-0 flex-1 flex-col justify-center gap-1 py-3.5 pr-2 pl-4'>
      {title}
      {meta && (
        <Text
          as='span'
          size='xs'
          tone={marked ? 'primary' : 'muted'}
          className='truncate'
        >
          {meta}
        </Text>
      )}
    </span>

    <span className='flex items-center pr-3'>
      <ChevronRightIcon className='size-5 opacity-50' />
    </span>
  </ButtonLink>
)
