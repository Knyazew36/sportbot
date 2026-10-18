import { RENDER_FORMATS, type RenderFormat } from '@sportbot/render-contract'
import { DownloadIcon, LoaderIcon, SendIcon } from 'lucide-react'

import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import type { RenderSlot } from './useRenderVideo'

type Props = {
  formats: readonly RenderFormat[]
  slotOf: (format: RenderFormat) => RenderSlot
  /** Заказать файл: экран проверяет форму и заказывает с её значениями */
  onOrder: (format: RenderFormat) => void
  onDownload: (slot: Extract<RenderSlot, { state: 'ready' }>) => void
  onSendToChat: (format: RenderFormat) => void
  isSending: boolean
}

const MainAction = ({
  slot,
  onOrder,
  onDownload,
}: { slot: RenderSlot } & Pick<Props, 'onDownload'> & { onOrder: () => void }) => {
  switch (slot.state) {
    case 'pending':
      return (
        <Button
          size='sm'
          variant='outline'
          disabled
        >
          <LoaderIcon className='animate-spin' />
          Готовим…
        </Button>
      )
    case 'ready':
      return (
        <Button
          size='sm'
          variant='success'
          onClick={() => onDownload(slot)}
        >
          <DownloadIcon />
          Скачать
        </Button>
      )
    default:
      return (
        <Button
          size='sm'
          onClick={onOrder}
        >
          {slot.state === 'failed' ? 'Ещё раз' : 'Сделать файл'}
        </Button>
      )
  }
}

// Форматы ролика: у каждого — где им пользоваться, файл на скачивание и отправка ботом в чат.
// Один формат на всех не годится: прозрачность понимают по-разному компьютер, браузер и телефон
export const RenderFormatList = ({ formats, slotOf, onOrder, onDownload, onSendToChat, isSending }: Props) => (
  <ul className='flex flex-col gap-3'>
    {formats.map(format => {
      const spec = RENDER_FORMATS[format]
      const slot = slotOf(format)
      return (
        <li
          key={format}
          className='border-foreground bg-card flex flex-col gap-2 border-[1.5px] p-3'
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
          {slot.state === 'failed' && (
            <Text
              size='sm'
              tone='danger'
            >
              {slot.error}
            </Text>
          )}
          <div className='flex flex-wrap gap-2'>
            <MainAction
              slot={slot}
              onOrder={() => onOrder(format)}
              onDownload={onDownload}
            />
            {spec.chat && (
              <Button
                size='sm'
                variant='outline'
                disabled={isSending}
                onClick={() => onSendToChat(format)}
              >
                <SendIcon />В чат
              </Button>
            )}
          </div>
        </li>
      )
    })}
  </ul>
)
