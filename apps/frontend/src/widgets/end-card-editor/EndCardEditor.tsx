import { zodResolver } from '@hookform/resolvers/zod'
import { COMPOSITIONS, END_CARD_SECONDS, type EndCardProps } from '@sportbot/render-contract'
import { useForm } from 'react-hook-form'

import { renderPropsSchema } from '@sportbot/api/entities/render'
import { FILL_OPTIONS, secondsOptions } from '@/features/render-video'
import { usePaletteChoice } from '@/shared/lib/hooks/use-palette'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { VideoFiles } from '@/widgets/video-files'
import { VideoPreview } from '@/widgets/video-preview/VideoPreview'

const COMPOSITION = 'end-card'
const { example } = COMPOSITIONS[COMPOSITION]

const SECONDS = secondsOptions(END_CARD_SECONDS)

// Заставка в конец своего видео: знак, «СпортБот» и где нас найти. Текст общий — выбираются цвет и длина
export const EndCardEditor = () => {
  const [palette] = usePaletteChoice()
  const form = useForm<EndCardProps>({
    resolver: zodResolver(renderPropsSchema(COMPOSITION)),
    defaultValues: { ...example, fill: palette === 'rose' ? 'rose' : 'mint' },
  })
  const { watch, setValue } = form
  const values = watch()

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
      <VideoFiles
        compositionId={COMPOSITION}
        form={form}
      />
    </div>
  )
}
