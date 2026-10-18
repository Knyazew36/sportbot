import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

import { color, ease, font } from '../brand'
import { Background, type BackgroundKind } from '../components/Background'
import { Card } from '../components/Card'

export type LowerThirdProps = {
  title: string
  subtitle: string
  fill: 'mint' | 'rest' | 'sheet'
  background: BackgroundKind
}

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

// Плашка поверх своего видео. Низ кадра ~250px перекрывает интерфейс Instagram — стоим выше
export const LowerThird = ({ title, subtitle, fill, background }: LowerThirdProps) => {
  const frame = useCurrentFrame()
  const { width, height, durationInFrames } = useVideoConfig()

  const enter = interpolate(frame, [0, 14], [0, 1], { easing: ease.enter, ...clamp })
  const sub = interpolate(frame, [6, 20], [0, 1], { easing: ease.enter, ...clamp })
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [0, 1], { easing: ease.exit, ...clamp })
  const x = (p: number) => `${(p - 1) * 120}% 0`

  return (
    <AbsoluteFill>
      <Background kind={background} />
      <div style={{ position: 'absolute', left: width * 0.06, bottom: height * 0.22, maxWidth: width * 0.82 }}>
        <div style={{ translate: x(enter - exit) }}>
          <Card
            fill={color[fill]}
            style={{ padding: `${width * 0.026}px ${width * 0.034}px` }}
          >
            <div style={{ fontFamily: font.sans, fontWeight: 600, fontSize: width * 0.05, lineHeight: 1.15, color: color.ink }}>
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontFamily: font.sans,
                  fontSize: width * 0.034,
                  lineHeight: 1.3,
                  marginTop: width * 0.01,
                  color: color.ink,
                  opacity: 0.7 * sub,
                }}
              >
                {subtitle}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AbsoluteFill>
  )
}
