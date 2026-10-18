import type { LowerThirdProps } from '@sportbot/render-contract'
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

import { ease } from '../brand'
import { LowerThirdCard } from '../cards/LowerThirdCard'
import { Background, CHROMA } from '../components/Background'

export type { LowerThirdProps }

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

// Мятная заливка близка к зелёному — под неё ключуем синим
const chromaFor = (fill: LowerThirdProps['fill']) => (fill === 'mint' ? CHROMA.blue : CHROMA.green)

// Плашка поверх своего видео. Низ кадра ~250px перекрывает интерфейс Instagram — стоим выше
export const LowerThird = ({ title, subtitle, fill, background }: LowerThirdProps) => {
  const frame = useCurrentFrame()
  const { width, height, durationInFrames } = useVideoConfig()

  const enter = interpolate(frame, [0, 14], [0, 1], { easing: ease.enter, ...clamp })
  const sub = interpolate(frame, [6, 20], [0, 1], { easing: ease.enter, ...clamp })
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [0, 1], { easing: ease.exit, ...clamp })
  const x = (p: number) => `${(p - 1) * 120}% 0`

  return (
    <AbsoluteFill from={-26}>
      <Background
        kind={background}
        chroma={chromaFor(fill)}
      />
      <div style={{ position: 'absolute', left: width * 0.06, bottom: height * 0.22, maxWidth: width * 0.82 }}>
        <div style={{ translate: x(enter - exit) }}>
          <LowerThirdCard
            title={title}
            subtitle={subtitle}
            fill={fill}
            unit={width}
            subtitleOpacity={sub}
          />
        </div>
      </div>
    </AbsoluteFill>
  )
}
