import type { CompositionId } from '@sportbot/render-contract'

import type { ComponentType } from 'react'

import { EndCardEditor } from '@/widgets/end-card-editor'
import { OverlayEditor } from '@/widgets/overlay-editor'

type EditorEntry = {
  /** Форма ролика: превью, поля, кнопки форматов */
  component: ComponentType
  /** Подпись на карточке хаба: что это и зачем */
  hint: string
}

// Форма на каждый ролик контракта: новая композиция в COMPOSITIONS без формы здесь не соберётся
export const EDITORS = {
  'lower-third': {
    component: OverlayEditor,
    hint: 'Название упражнения и план подходов поверх твоего ролика',
  },
  'end-card': {
    component: EndCardEditor,
    hint: 'В конец ролика: где найти СпортБот в Telegram и MAX',
  },
} satisfies Record<CompositionId, EditorEntry>
