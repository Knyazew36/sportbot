import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

import { color, ease, font } from '../brand'
import { Background, type BackgroundKind } from '../components/Background'
import { Card } from '../components/Card'

export type NumberCardProps = {
  value: number
  unit: string
  label: string
  fill: 'mint' | 'rest' | 'sheet'
  background: BackgroundKind
}

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

export const NumberCard = ({ value, unit, label, fill, background }: NumberCardProps) => {
  const frame = useCurrentFrame()
  const { fps, width, durationInFrames } = useVideoConfig()

  const enter = interpolate(frame, [0, 14], [0, 1], { easing: ease.enter, ...clamp })
  const exit = interpolate(frame, [durationInFrames - 10, durationInFrames], [0, 1], { easing: ease.exit, ...clamp })
  const count = interpolate(frame, [8, 48], [0, value], { easing: Easing.out(Easing.cubic), ...clamp })
  // Цифра досчитала — плитка «нажимается», единственное место для punch
  const press =
    frame < 48 ? 0 : frame < 52 ? interpolate(frame, [48, 52], [0, 1]) : 1 - spring({ frame: frame - 52, fps, config: { damping: 9 } })
  const labelIn = interpolate(frame, [30, 44], [0, 1], { easing: ease.enter, ...clamp })

  return (
    <AbsoluteFill>
      <Background kind={background} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ opacity: enter * (1 - exit), translate: `0 ${(1 - enter) * 120 + exit * 80}px` }}>
          <Card
            fill={color[fill]}
            press={press}
            style={{ width: width * 0.72, padding: `${width * 0.06}px ${width * 0.065}px` }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, color: color.ink }}>
              <span style={{ fontFamily: font.display, fontWeight: 600, fontSize: width * 0.28, lineHeight: 0.9 }}>
                {Math.round(count).toLocaleString('ru-RU')}
              </span>
              <span style={{ fontFamily: font.display, fontWeight: 500, fontSize: width * 0.1 }}>{unit}</span>
            </div>
            <div
              style={{
                fontFamily: font.sans,
                fontSize: width * 0.042,
                lineHeight: 1.25,
                marginTop: width * 0.03,
                color: color.ink,
                opacity: labelIn,
              }}
            >
              {label}
            </div>
          </Card>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
