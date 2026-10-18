import { zodResolver } from '@hookform/resolvers/zod'
import { COMPOSITIONS, LOWER_THIRD_SECONDS, type LowerThirdProps, type RenderFormat } from '@sportbot/render-contract'
import { useForm } from 'react-hook-form'

import { renderPropsSchema } from '@/entities/render'
import { RenderFormatList, useRenderVideo } from '@/features/render-video'
import { applyFieldErrors } from '@/shared/lib/form'
import { usePaletteChoice } from '@/shared/lib/hooks/use-palette'
import { getMiniappPlatform } from '@/shared/miniapp'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { TextField } from '@/shared/ui/kit/TextField'
import { VideoPreview } from '@/widgets/video-preview/VideoPreview'

const COMPOSITION = 'lower-third'
const { formats, example } = COMPOSITIONS[COMPOSITION]

const FILLS: { value: LowerThirdProps['fill']; label: string }[] = [
  { value: 'mint', label: 'Мята' },
  { value: 'rest', label: 'Абрикос' },
  { value: 'blue', label: 'Синяя' },
  { value: 'rose', label: 'Розовая' },
]

const SECONDS = LOWER_THIRD_SECONDS.map(s => ({ value: String(s), label: `${s} с` }))

type OverlayEditorProps = {
  /** Текст, с которым форма открывается: например, название и план упражнения. Нет — пример из контракта */
  initial?: Partial<Pick<LowerThirdProps, 'title' | 'subtitle'>>
}

// Плашка упражнения для своего видео: текст правится тут же, превью — та же вёрстка, что в ролике.
// Начальные значения читаются при монтировании: для другого упражнения монтируем заново (key)
export const OverlayEditor = ({ initial }: OverlayEditorProps) => {
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
    defaultValues: { ...example, ...initial, fill: palette === 'rose' ? 'rose' : 'mint' },
  })
  const values = watch()
  const render = useRenderVideo(COMPOSITION, values)
  // Бот в MAX файлы пока не отправляет — там только скачивание
  const chat = getMiniappPlatform() !== 'max'

  // Кнопки форматов — не submit формы: каждая проверяет форму и заказывает свой формат
  const withValues = (action: (values: LowerThirdProps) => Promise<unknown>) =>
    handleSubmit(valid => action(valid).catch(error => applyFieldErrors(error, setError)))()

  return (
    <div className='flex flex-col gap-4'>
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
      <Segmented
        options={SECONDS}
        value={String(values.seconds)}
        onValueChange={seconds => setValue('seconds', Number(seconds) as LowerThirdProps['seconds'])}
        size='sm'
        stretch
      />
      <RenderFormatList
        formats={formats}
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
