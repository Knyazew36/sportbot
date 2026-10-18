import { zodResolver } from '@hookform/resolvers/zod'
import { COMPOSITIONS, LOWER_THIRD_SECONDS, type LowerThirdProps } from '@sportbot/render-contract'
import { useForm } from 'react-hook-form'

import { renderPropsSchema } from '@/entities/render'
import { FILL_OPTIONS, secondsOptions } from '@/features/render-video'
import { usePaletteChoice } from '@/shared/lib/hooks/use-palette'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { TextField } from '@/shared/ui/kit/TextField'
import { VideoFiles } from '@/widgets/video-files'
import { VideoPreview } from '@/widgets/video-preview/VideoPreview'

const COMPOSITION = 'lower-third'
const { example } = COMPOSITIONS[COMPOSITION]

const SECONDS = secondsOptions(LOWER_THIRD_SECONDS)

type OverlayEditorProps = {
  /** Текст, с которым форма открывается: например, название и план упражнения. Нет — пример из контракта */
  initial?: Partial<Pick<LowerThirdProps, 'title' | 'subtitle'>>
}

// Плашка упражнения для своего видео: текст правится тут же, превью — та же вёрстка, что в ролике.
// Начальные значения читаются при монтировании: для другого упражнения монтируем заново (key)
export const OverlayEditor = ({ initial }: OverlayEditorProps) => {
  const [palette] = usePaletteChoice()
  const form = useForm<LowerThirdProps>({
    resolver: zodResolver(renderPropsSchema(COMPOSITION)),
    defaultValues: { ...example, ...initial, fill: palette === 'rose' ? 'rose' : 'mint' },
  })
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form
  const values = watch()

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
        options={FILL_OPTIONS}
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
      <VideoFiles
        compositionId={COMPOSITION}
        form={form}
      />
    </div>
  )
}
