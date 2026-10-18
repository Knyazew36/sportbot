import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

import { color, ease, font, rose, roseDark } from '../brand'
import { Background, type BackgroundKind } from '../components/Background'
import { Card } from '../components/Card'

export type LowerThirdProps = {
  title: string
  subtitle: string
  fill: 'mint' | 'rest' | 'sheet' | 'rose'
  background: BackgroundKind
}

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

// Розовая плашка — акцент тёмной розовой темы приложения; на нём читается только тёмный текст
const palette = (fill: LowerThirdProps['fill']) =>
  fill === 'rose'
    ? { fill: roseDark.blue, text: rose.ink, ink: rose.ink }
    : { fill: color[fill], text: color.ink, ink: color.ink }

// Плашка поверх своего видео. Низ кадра ~250px перекрывает интерфейс Instagram — стоим выше
export const LowerThird = ({ title, subtitle, fill, background }: LowerThirdProps) => {
  const frame = useCurrentFrame()
  const { width, height, durationInFrames } = useVideoConfig()

  const enter = interpolate(frame, [0, 14], [0, 1], { easing: ease.enter, ...clamp })
  const sub = interpolate(frame, [6, 20], [0, 1], { easing: ease.enter, ...clamp })
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [0, 1], { easing: ease.exit, ...clamp })
  const x = (p: number) => `${(p - 1) * 120}% 0`
  const tone = palette(fill)

  return (
    <AbsoluteFill from={-26}>
      <Background kind={background} />
      <div style={{ position: 'absolute', left: width * 0.06, bottom: height * 0.22, maxWidth: width * 0.82 }}>
        <div style={{ translate: x(enter - exit) }}>
          <Card
            fill={tone.fill}
            ink={tone.ink}
            style={{ padding: `${width * 0.026}px ${width * 0.034}px` }}
          >
            <div style={{ fontFamily: font.sans, fontWeight: 600, fontSize: width * 0.05, lineHeight: 1.15, color: tone.text }}>
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontFamily: font.sans,
                  fontSize: width * 0.034,
                  lineHeight: 1.3,
                  marginTop: width * 0.01,
                  color: tone.text,
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
