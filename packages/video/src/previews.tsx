import { type CompositionId, type CompositionProps, COMPOSITIONS } from '@sportbot/render-contract'

import type { ComponentType } from 'react'

import { LowerThirdCard } from './cards/LowerThirdCard'
import { durationOf } from './duration'
import { formats } from './tokens'

// Превью для приложения: та же вёрстка, что в ролике, но без Remotion и плеера — статичная
// карточка, движение даёт CSS. Без Remotion-хуков, поэтому импорт отсюда не тянет remotion

export type PreviewProps<Id extends CompositionId> = {
  props: CompositionProps<Id>
  /** Ширина кадра превью в px */
  unit: number
}

type Preview<Id extends CompositionId> = {
  component: ComponentType<PreviewProps<Id>>
  /** Сколько кадров длится выезд и уезд — как в композиции */
  enterFrames: number
  exitFrames: number
}

const PREVIEWS: { [Id in CompositionId]: Preview<Id> } = {
  // Тайминги — из compositions/LowerThird.tsx: выезд 0–14 кадр, уезд — последние 12
  'lower-third': {
    component: ({ props, unit }) => (
      <LowerThirdCard
        {...props}
        unit={unit}
      />
    ),
    enterFrames: 14,
    exitFrames: 12,
  },
}

/** Превью и его таймлайн в секундах: весь ролик, выезд и уезд — доли от него. Длина — от props */
export const previewOf = <Id extends CompositionId>(id: Id, props: CompositionProps<Id>) => {
  const preview = PREVIEWS[id] as Preview<Id>
  const { size } = COMPOSITIONS[id]
  const durationInFrames = durationOf(id, props)
  return {
    component: preview.component,
    seconds: durationInFrames / formats[size].fps,
    enter: preview.enterFrames / durationInFrames,
    exit: 1 - preview.exitFrames / durationInFrames,
  }
}
