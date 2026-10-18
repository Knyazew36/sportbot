import type { LowerThirdProps } from '@sportbot/render-contract'

import { color, dark, rose, roseDark } from '../tokens'

export type Fill = LowerThirdProps['fill']

/**
 * Цвета ролика по заливке: плитка (fill), текст на ней и обводка с тенью (ink), лист под всем (paper).
 * Розовая и синяя — акценты тёмных тем приложения: на них читается только тёмный текст
 */
export const paletteOf = (fill: Fill) => {
  if (fill === 'rose') return { fill: roseDark.blue, ink: rose.ink, paper: rose.paper }
  if (fill === 'blue') return { fill: dark.blue, ink: color.ink, paper: color.paper }
  return { fill: color[fill], ink: color.ink, paper: color.paper }
}
