import type { EndCardProps } from '@sportbot/render-contract'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'

import { EndCardContent } from '../cards/EndCardContent'
import { END_CARD_TIMING, endCardMotion, enterAt } from '../cards/end-card-motion'
import { paletteOf } from '../cards/palette'
import { Background, CHROMA } from '../components/Background'

export type { EndCardProps }

// Мятная заливка близка к зелёному — под неё ключуем синим; остальные — зелёным
const chromaFor = (fill: EndCardProps['fill']) => (fill === 'mint' ? CHROMA.blue : CHROMA.green)

/**
 * Финальная заставка ролика: знак, название и где нас найти. С фоном paper ставится встык в конец
 * видео — лист сразу на весь кадр. Прозрачная или на хромакее — внахлёст на последние кадры:
 * лист въезжает снизу и закрывает видео
 */
export const EndCard = ({ fill, background }: EndCardProps) => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()

  const sheet = background === 'paper' ? 1 : enterAt(frame, END_CARD_TIMING.sheet, 9)

  return (
    <AbsoluteFill>
      {background !== 'paper' && (
        <Background
          kind={background}
          chroma={chromaFor(fill)}
        />
      )}
      <AbsoluteFill style={{ background: paletteOf(fill).paper, translate: `0 ${(1 - sheet) * height}px` }} />
      {/* Чуть выше центра: низ кадра перекрывает интерфейс Instagram */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: height * 0.08 }}>
        <EndCardContent
          fill={fill}
          unit={width}
          motion={endCardMotion(frame)}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
