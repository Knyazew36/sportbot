import { zodResolver } from '@hookform/resolvers/zod'
import { COMPOSITIONS, type LowerThirdProps, type RenderFormat } from '@sportbot/render-contract'
import { useForm } from 'react-hook-form'

import { renderPropsSchema } from '@/entities/render'
import { RenderFormatList, useRenderVideo } from '@/features/render-video'
import { applyFieldErrors } from '@/shared/lib/form'
import { usePaletteChoice } from '@/shared/lib/hooks/use-palette'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { TextField } from '@/shared/ui/kit/TextField'
import { VideoPreview } from '@/widgets/video-preview/VideoPreview'

const COMPOSITION = 'lower-third'
const { formats, example } = COMPOSITIONS[COMPOSITION]

const FILLS: { value: LowerThirdProps['fill']; label: string }[] = [
  { value: 'mint', label: 'Мята' },
  { value: 'rest', label: 'Абрикос' },
  { value: 'sheet', label: 'Белая' },
  { value: 'rose', label: 'Розовая' },
]

// Плашка упражнения для своего видео: текст правится тут же, превью — та же вёрстка, что в ролике.
// Живёт в разделе профиля «Редактор» — потом переедет к упражнению
export const VideoOverlaySection = () => {
  const [palette] = usePaletteChoice()
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LowerThirdProps>({
    resolver: zodResolver(renderPropsSchema(COMPOSITION)),
    defaultValues: { ...example, fill: palette === 'rose' ? 'rose' : 'mint' },
  })
  const values = watch()
  const render = useRenderVideo(COMPOSITION, values)

  // Кнопки форматов — не submit формы: каждая проверяет форму и заказывает свой формат
  const withValues = (action: (values: LowerThirdProps) => Promise<unknown>) =>
    handleSubmit(valid => action(valid).catch(error => applyFieldErrors(error, setError)))()

  return (
    <ScreenSection
      title='Плашка для видео'
      aside='оверлей'
    >
      <VideoPreview
        compositionId={COMPOSITION}
        props={values}
      />
      <TextField
        label='Название'
        error={errors.title}
        {...register('title')}
      />
      <TextField
        label='Подпись'
        placeholder='4 подхода × 10 повторов'
        error={errors.subtitle}
        {...register('subtitle')}
      />
      <Segmented
        options={FILLS}
        value={values.fill}
        onValueChange={fill => setValue('fill', fill)}
        size='sm'
        stretch
      />
      <RenderFormatList
        formats={formats}
        slotOf={render.slotOf}
        onOrder={(format: RenderFormat) => withValues(valid => render.order(format, valid))}
        onDownload={slot => slot.job && render.download(slot.job)}
        onSendToChat={format => withValues(valid => render.sendToChat(format, valid))}
      />
    </ScreenSection>
  )
}
