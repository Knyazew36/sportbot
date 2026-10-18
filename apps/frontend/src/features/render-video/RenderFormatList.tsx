import { RENDER_FORMATS, renderEstimateSec, type RenderFormat } from '@sportbot/render-contract'
import { CheckIcon, ClockIcon, DownloadIcon, LoaderIcon, SendIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import type { RenderSlot } from './useRenderVideo'

type Props = {
  formats: readonly RenderFormat[]
  /** Длина ролика, с: от неё зависит, сколько делается файл */
  seconds: number
  slotOf: (format: RenderFormat) => RenderSlot
  /** Заказать файл: экран проверяет форму и заказывает с её значениями */
  onOrder: (format: RenderFormat) => void
  onDownload: (slot: RenderSlot) => void
  onSendToChat: (format: RenderFormat) => void
}

const Spinner = () => <LoaderIcon className='animate-spin' />

const FileButton = ({
  slot,
  onOrder,
  onDownload,
}: {
  slot: RenderSlot
  onOrder: () => void
  onDownload: () => void
}) => {
  if (slot.file === 'pending')
    return (
      <Button
        size='sm'
        variant='outline'
        disabled
      >
        <Spinner />
        Готовим…
      </Button>
    )
  if (slot.file === 'ready')
    return (
      <Button
        size='sm'
        variant='success'
        onClick={onDownload}
      >
        <DownloadIcon />
        Скачать
      </Button>
    )
  return (
    <Button
      size='sm'
      onClick={onOrder}
    >
      {slot.file === 'failed' ? 'Ещё раз' : 'Сделать файл'}
    </Button>
  )
}

// Ждём — кнопка заблокирована: повторное нажатие не поставит вторую задачу и не пришлёт файл дважды
const ChatButton = ({ slot, onSend }: { slot: RenderSlot; onSend: () => void }) => {
  if (slot.chat === 'waiting')
    return (
      <Button
        size='sm'
        variant='outline'
        disabled
      >
        <Spinner />
        {slot.file === 'ready' ? 'Отправляем…' : 'Пришлём, как будет готов'}
      </Button>
    )
  if (slot.chat === 'sent')
    return (
      <Button
        size='sm'
        variant='outline'
        disabled
      >
        <CheckIcon />В чате
      </Button>
    )
  return (
    <Button
      size='sm'
      variant='outline'
      disabled={slot.file === 'pending' && slot.chat === 'idle' && !slot.job}
      onClick={onSend}
    >
      <SendIcon />
      {slot.chat === 'failed' ? 'В чат ещё раз' : 'В чат'}
    </Button>
  )
}

// Форматы ролика: у каждого — где им пользоваться, файл на скачивание и отправка ботом в чат.
// Один формат на всех не годится: прозрачность понимают по-разному компьютер, браузер и телефон
// Готовый файл выделяем: его карточка приподнята синей тенью, как выбранное в приложении
export const RenderFormatList = ({ formats, seconds, slotOf, onOrder, onDownload, onSendToChat }: Props) => (
  <ul className='flex flex-col gap-3'>
    {formats.map(format => {
      const spec = RENDER_FORMATS[format]
      const slot = slotOf(format)
      const ready = slot.file === 'ready'
      return (
        <li
          key={format}
          className={cn(
            'border-foreground bg-card flex flex-col gap-2 border-[1.5px] p-3 transition-shadow',
            ready && 'border-primary mr-[3px] shadow-[3px_3px_0_var(--sb-blue)]',
          )}
        >
          <Poster
            as='h3'
            size='sm'
          >
            {spec.label}
          </Poster>
          <Text
            size='sm'
            tone='muted'
          >
            {spec.hint}
          </Text>
          {!ready && (
            <Text
              size='sm'
              className='flex items-center gap-1.5'
            >
              <ClockIcon className='size-3.5 shrink-0' />
              Сделаем примерно за {renderEstimateSec(format, seconds)} с
            </Text>
          )}
          {slot.error && (
            <Text
              size='sm'
              tone='danger'
            >
              {slot.error}
            </Text>
          )}
          <div className='flex flex-wrap gap-2'>
            <FileButton
              slot={slot}
              onOrder={() => onOrder(format)}
              onDownload={() => onDownload(slot)}
            />
            {spec.chat && (
              <ChatButton
                slot={slot}
                onSend={() => onSendToChat(format)}
              />
            )}
          </div>
        </li>
      )
    })}
  </ul>
)
