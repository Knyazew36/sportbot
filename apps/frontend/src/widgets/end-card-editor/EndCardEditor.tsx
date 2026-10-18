import { zodResolver } from '@hookform/resolvers/zod'
import { COMPOSITIONS, END_CARD_SECONDS, type EndCardProps, type RenderFormat } from '@sportbot/render-contract'
import { useForm } from 'react-hook-form'

import { renderPropsSchema } from '@/entities/render'
import { FILL_OPTIONS, RenderFormatList, secondsOptions, useRenderVideo } from '@/features/render-video'
import { applyFieldErrors } from '@/shared/lib/form'
import { usePaletteChoice } from '@/shared/lib/hooks/use-palette'
import { getMiniappPlatform } from '@/shared/miniapp'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { VideoPreview } from '@/widgets/video-preview/VideoPreview'

const COMPOSITION = 'end-card'
const { formats, hints, example } = COMPOSITIONS[COMPOSITION]

const SECONDS = secondsOptions(END_CARD_SECONDS)

// Заставка в конец своего видео: знак, «СпортБот» и где нас найти. Текст общий — выбираются цвет и длина
export const EndCardEditor = () => {
  const [palette] = usePaletteChoice()
  const { watch, setValue, handleSubmit, setError } = useForm<EndCardProps>({
    resolver: zodResolver(renderPropsSchema(COMPOSITION)),
    defaultValues: { ...example, fill: palette === 'rose' ? 'rose' : 'mint' },
  })
  const values = watch()
  const render = useRenderVideo(COMPOSITION, values)
  // Бот в MAX файлы пока не отправляет — там только скачивание
  const chat = getMiniappPlatform() !== 'max'

  // Кнопки форматов — не submit формы: каждая проверяет форму и заказывает свой формат
  const withValues = (action: (values: EndCardProps) => Promise<unknown>) =>
    handleSubmit(valid => action(valid).catch(error => applyFieldErrors(error, setError)))()

  return (
    <div className='flex flex-col gap-4'>
      <VideoPreview
        compositionId={COMPOSITION}
        props={values}
      />
      <Segmented
        options={FILL_OPTIONS}
        value={values.fill}
        onValueChange={fill => setValue('fill', fill)}
        size='sm'
        stretch
      />
      <Segmented
        options={SECONDS}
        value={String(values.seconds)}
        onValueChange={seconds => setValue('seconds', Number(seconds) as EndCardProps['seconds'])}
        size='sm'
        stretch
      />
      <RenderFormatList
        formats={formats}
        hints={hints}
        seconds={values.seconds}
        chat={chat}
        slotOf={render.slotOf}
        onOrder={(format: RenderFormat) => withValues(valid => render.order(format, valid))}
        onDownload={slot => slot.job && render.download(slot.job)}
        onSendToChat={format => withValues(valid => render.sendToChat(format, valid))}
      />
    </div>
  )
}
