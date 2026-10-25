import { RENDER_FORMATS, type RenderFormat } from '@sportbot/render-contract'

import type { RenderJob } from '@sportbot/api/entities/render'
import { slotOfJob } from '@/features/render-video'

export const isKnownFormat = (format: string): format is RenderFormat => format in RENDER_FORMATS

/**
 * Файлы для показа. Список идёт от новых к старым: на каждый файл (ролик + формат + props) — только
 * последняя задача, чтобы упавшая не висела рядом с повтором. Удалённые по сроку не показываем
 */
export const visibleFiles = (jobs: RenderJob[] | undefined) => {
  const seen = new Set<string>()
  return (jobs ?? []).filter(job => {
    const key = `${job.compositionId}|${job.format}|${JSON.stringify(job.props)}`
    if (seen.has(key)) return false
    seen.add(key)
    return isKnownFormat(job.format) && slotOfJob(job).file !== 'idle'
  })
}

/** «2 готовы · 1 делается» — для строки «Мои файлы» в хабе */
export const filesSummary = (files: RenderJob[]) => {
  const ready = files.filter(job => slotOfJob(job).file === 'ready').length
  const pending = files.filter(job => slotOfJob(job).file === 'pending').length
  const failed = files.filter(job => slotOfJob(job).file === 'failed').length
  const parts = [
    ready > 0 && `готово: ${ready}`,
    pending > 0 && `делается: ${pending}`,
    failed > 0 && `не получилось: ${failed}`,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'пока пусто'
}
