import type { CompositionId, CompositionProps, RenderFormat } from '@sportbot/render-contract'
import type { UseFormReturn } from 'react-hook-form'

import { RenderFormatList, useRenderVideo } from '@/features/render-video'
import { applyFieldErrors } from '@/shared/lib/form'
import { getMiniappPlatform } from '@/shared/miniapp'

type VideoFilesProps<Id extends CompositionId> = {
  compositionId: Id
  /** Форма редактора: кнопки проверяют её и заказывают файл с её значениями */
  form: UseFormReturn<CompositionProps<Id>>
}

// Блок «скачать» под любым видео редактора: одни и те же форматы, заказ, скачивание и отправка в чат.
// Новому ролику достаточно своей формы — форматы и кнопки берутся отсюда
export const VideoFiles = <Id extends CompositionId>({ compositionId, form }: VideoFilesProps<Id>) => {
  const values = form.watch()
  const render = useRenderVideo(compositionId, values)
  // Бот в MAX файлы пока не отправляет — там только скачивание
  const chat = getMiniappPlatform() !== 'max'

  // Кнопки форматов — не submit формы: каждая проверяет форму и заказывает свой формат
  const withValues = (action: (values: CompositionProps<Id>) => Promise<unknown>) =>
    form.handleSubmit(valid => action(valid).catch(error => applyFieldErrors(error, form.setError)))()

  return (
    <RenderFormatList
      seconds={values.seconds}
      chat={chat}
      slotOf={render.slotOf}
      onOrder={(format: RenderFormat) => withValues(valid => render.order(format, valid))}
      onDownload={slot => slot.job && render.download(slot.job)}
      onSendToChat={format => withValues(valid => render.sendToChat(format, valid))}
    />
  )
}
