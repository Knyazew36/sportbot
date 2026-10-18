import type { CompositionId, CompositionProps } from '@sportbot/render-contract'

import type { ComponentType } from 'react'

import { LowerThirdCard } from './cards/LowerThirdCard'

// Превью для приложения: та же вёрстка, что в ролике, но без Remotion и плеера — статичная
// карточка, анимацию появления даёт CSS. Без Remotion-хуков, поэтому импорт отсюда не тянет remotion

export type PreviewProps<Id extends CompositionId> = {
  props: CompositionProps<Id>
  /** Ширина кадра превью в px */
  unit: number
}

const PREVIEWS: { [Id in CompositionId]: ComponentType<PreviewProps<Id>> } = {
  'lower-third': ({ props, unit }) => (
    <LowerThirdCard
      {...props}
      unit={unit}
    />
  ),
}

export const previewOf = <Id extends CompositionId>(id: Id) => PREVIEWS[id] as ComponentType<PreviewProps<Id>>
