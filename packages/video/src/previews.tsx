import { type CompositionId, type CompositionProps, COMPOSITIONS } from '@sportbot/render-contract'

import type { ComponentType } from 'react'

import { EndCardContent } from './cards/EndCardContent'
import { END_CARD_SETTLED_FRAME, endCardMotion } from './cards/end-card-motion'
import { LowerThirdCard } from './cards/LowerThirdCard'
import { durationOf } from './duration'
import { formats } from './tokens'

// Превью для приложения: та же вёрстка, что в ролике, но без Remotion и плеера. Плашка — статичная
// карточка, выезд даёт CSS. Заставка двигается покадрово тем же расчётом, что в ролике.
// Без Remotion-хуков, поэтому импорт отсюда не тянет remotion

export type PreviewProps<Id extends CompositionId> = {
  props: CompositionProps<Id>
  /** Ширина кадра превью в px */
  unit: number
  /** Кадр ролика для покадровых превью. Нет — всё на месте */
  frame?: number
}

type Preview<Id extends CompositionId> = {
  component: ComponentType<PreviewProps<Id>>
  /** slide — карточку целиком выносит и уносит превью; frames — компонент сам двигается по frame */
  animation: 'slide' | 'frames'
  /** Сколько кадров длится выезд (для frames — до полной остановки) и уезд — как в композиции */
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
    animation: 'slide',
    enterFrames: 14,
    exitFrames: 12,
  },
  // Заставка без листа: в превью видно только то, что в ней движется. Тайминги — из cards/end-card-motion.ts
  'end-card': {
    component: ({ props, unit, frame }) => (
      <div style={{ width: unit, paddingBottom: unit * 0.04, display: 'flex', justifyContent: 'center' }}>
        <EndCardContent
          fill={props.fill}
          unit={unit}
          motion={frame === undefined ? undefined : endCardMotion(frame)}
        />
      </div>
    ),
    animation: 'frames',
    enterFrames: END_CARD_SETTLED_FRAME,
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
    animation: preview.animation,
    fps: formats[size].fps,
    seconds: durationInFrames / formats[size].fps,
    enter: preview.enterFrames / durationInFrames,
    exit: 1 - preview.exitFrames / durationInFrames,
  }
}
