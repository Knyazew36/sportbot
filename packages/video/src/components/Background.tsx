import type { LowerThirdProps } from '@sportbot/render-contract'
import { AbsoluteFill } from 'remotion'

import { color } from '../brand'

export type BackgroundKind = LowerThirdProps['background']

// Ключевые цвета хромакея — не фирменные, а технические: чистые, чтобы редактор снял их без остатка
export const CHROMA = { green: '#00ff00', blue: '#0000ff' } as const

type Props = {
  kind: BackgroundKind
  /** Цвет под chroma: подбирается под заливку, иначе кеинг съест плашку вместе с фоном */
  chroma?: string
}

export const Background = ({ kind, chroma = CHROMA.green }: Props) => {
  if (kind === 'paper') return <AbsoluteFill style={{ background: color.paper }} />
  if (kind === 'chroma') return <AbsoluteFill style={{ background: chroma }} />
  return null
}
