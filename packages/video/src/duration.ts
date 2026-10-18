import { type CompositionId, COMPOSITIONS } from '@sportbot/render-contract'

import { formats } from './tokens'

// Без Remotion: длительность нужна и Studio с сервером (calculateMetadata), и превью на фронте

/** Длительность ролика в кадрах: выбрана в props (seconds) — столько, иначе — из контракта */
export const durationOf = (id: CompositionId, props: Record<string, unknown>) => {
  const { durationInFrames, size } = COMPOSITIONS[id]
  return typeof props.seconds === 'number' ? Math.round(props.seconds * formats[size].fps) : durationInFrames
}
