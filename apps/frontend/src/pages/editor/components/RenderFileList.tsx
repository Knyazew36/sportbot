import { COMPOSITIONS, isCompositionId, RENDER_FORMATS, type RenderFormat } from '@sportbot/render-contract'
import { ClockIcon, Trash2Icon } from 'lucide-react'

import { type RenderJob, useDeleteRenderFile, useOrderRender, useOrderRenderToChat } from '@sportbot/api/entities/render'
import { ChatButton, downloadRender, FileButton, slotOfJob } from '@/features/render-video'
import { getMiniappPlatform } from '@/shared/miniapp'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

const HOUR_MS = 60 * 60 * 1000

/** «Удалим через 5 ч»: округляем вверх, меньше часа — всё равно «1 ч» */
const expiresText = (expiresAt: string) =>
  `Удалим через ${Math.max(1, Math.ceil((Date.parse(expiresAt) - Date.now()) / HOUR_MS))} ч`

// Свои файлы роликов: что за ролик, его текст, формат, сколько ещё лежит, и те же кнопки, что в форме.
// Файлы уже отобраны visibleFiles — формат у каждого известный
export const RenderFileList = ({ files }: { files: RenderJob[] }) => {
  const orderFile = useOrderRender()
  const orderChat = useOrderRenderToChat()
  const deleteFile = useDeleteRenderFile()
  // Бот в MAX файлы пока не отправляет — там только скачивание
  const chat = getMiniappPlatform() !== 'max'

  // «В чат» — тот же заказ: сервер вернёт эту же задачу. «Ещё раз» у упавшего — новая задача, старая уйдёт из списка.
  // mutate, а не mutateAsync: ошибку показывает общий тост, ловить её здесь незачем
  const reorder = (job: RenderJob, toChat: boolean) => {
    if (!isCompositionId(job.compositionId)) return
    const dto = { compositionId: job.compositionId, format: job.format as RenderFormat, props: job.props }
    if (toChat) orderChat.mutate(dto)
    else orderFile.mutate(dto)
  }

  return (
    <ul className='flex flex-col gap-3'>
      {files.map(job => {
        const spec = RENDER_FORMATS[job.format as RenderFormat]
        const slot = slotOfJob(job)
        const { title, subtitle } = job.props as { title?: string; subtitle?: string }
        return (
          <li
            key={job.id}
            className='border-foreground bg-card flex flex-col gap-2 border-[1.5px] p-3'
          >
            {isCompositionId(job.compositionId) && <Eyebrow>{COMPOSITIONS[job.compositionId].title}</Eyebrow>}
            {/* У заставки своего текста нет — название ролика уже в строке над ним */}
            {title && (
              <Poster
                as='h3'
                size='sm'
              >
                {title}
              </Poster>
            )}
            {subtitle && <Text size='sm'>{subtitle}</Text>}
            <Text
              size='sm'
              tone='muted'
            >
              {spec.label}
            </Text>
            {slot.file === 'ready' && job.expiresAt && (
              <Text
                size='sm'
                className='flex items-center gap-1.5'
              >
                <ClockIcon className='size-3.5 shrink-0' />
                {expiresText(job.expiresAt)}
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
                onOrder={() => reorder(job, false)}
                onDownload={() => downloadRender(job)}
              />
              {chat && spec.chat && (
                <ChatButton
                  slot={slot}
                  onSend={() => reorder(job, true)}
                />
              )}
              {/* Удалить можно только готовый: в работе файла ещё нет, у упавшего есть «Ещё раз» */}
              {slot.file === 'ready' && (
                <ConfirmAction
                  trigger={
                    <Button
                      size='sm'
                      variant='outline'
                    />
                  }
                  title='Удалить файл?'
                  description='Скачать его будет нельзя — только сделать заново.'
                  confirmLabel='Удалить'
                  onConfirm={() => deleteFile.mutateAsync(job.id)}
                >
                  <Trash2Icon />
                  Удалить
                </ConfirmAction>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
