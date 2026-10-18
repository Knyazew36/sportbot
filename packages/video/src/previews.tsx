import { type CompositionId, type CompositionProps, COMPOSITIONS } from '@sportbot/render-contract'

import type { ComponentType } from 'react'

import { EndCardContent } from './cards/EndCardContent'
import { LowerThirdCard } from './cards/LowerThirdCard'
import { paletteOf } from './cards/palette'
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
  // Заставка — на своём листе. Тайминги — из compositions/EndCard.tsx: всё на месте к 36 кадру, уезда нет
  'end-card': {
    component: ({ props, unit }) => (
      <div
        style={{
          width: unit,
          padding: `${unit * 0.12}px 0`,
          display: 'flex',
          justifyContent: 'center',
          background: paletteOf(props.fill).paper,
        }}
      >
        <EndCardContent
          fill={props.fill}
          unit={unit}
        />
      </div>
    ),
    enterFrames: 36,
    exitFrames: 0,
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
