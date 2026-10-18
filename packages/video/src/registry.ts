import { type CompositionId, COMPOSITIONS } from '@sportbot/render-contract'

import type { ComponentType } from 'react'

import { formats } from './brand'
import { EndCard } from './compositions/EndCard'
import { LowerThird } from './compositions/LowerThird'

// Компонент к каждой композиции контракта. Добавить ролик для пользователей: схема и мета —
// в @sportbot/render-contract, компонент — сюда. Studio, превью и сервер подхватят сами
const COMPONENTS: { [Id in CompositionId]: ComponentType<never> } = {
  'lower-third': LowerThird,
  'end-card': EndCard,
}

export const compositionOf = (id: CompositionId) => {
  const meta = COMPOSITIONS[id]
  const { width, height, fps } = formats[meta.size]
  return {
    id,
    component: COMPONENTS[id] as ComponentType<Record<string, unknown>>,
    schema: meta.schema,
    defaultProps: meta.example,
    durationInFrames: meta.durationInFrames,
    width,
    height,
    fps,
  }
}
