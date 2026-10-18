import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

import { color, ease, font } from '../brand'
import { Background, type BackgroundKind } from '../components/Background'
import { Mark } from '../components/Mark'

export type LogoStingProps = {
  /** outro — та же анимация задом наперёд */
  mode: 'intro' | 'outro'
  background: BackgroundKind
}

export const LogoSting = ({ mode, background }: LogoStingProps) => {
  const frame = useCurrentFrame()
  const { fps, width, durationInFrames } = useVideoConfig()
  const t = mode === 'outro' ? durationInFrames - 1 - frame : frame

  const appear = spring({ frame: t, fps, config: { damping: 12, stiffness: 180 } })
  const play = spring({ frame: t - 8, fps, config: { damping: 10, stiffness: 200 } })
  // Нажатие, как у кнопки приложения: плитка уходит в тень и отскакивает
  const press =
    t < 26
      ? 0
      : t < 30
        ? interpolate(t, [26, 30], [0, 1], { easing: ease.enter })
        : 1 - spring({ frame: t - 30, fps, config: { damping: 9, stiffness: 220 } })
  const word = interpolate(t, [20, 36], [0, 1], {
    easing: ease.enter,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const size = width * 0.42

  return (
    <AbsoluteFill>
      <Background kind={background} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: width * 0.04 }}>
        <div style={{ scale: appear }}>
          <Mark
            size={size}
            press={press}
            play={play}
          />
        </div>
        <div
          style={{
            fontFamily: font.display,
            fontWeight: 600,
            fontSize: width * 0.13,
            lineHeight: 0.9,
            letterSpacing: '-0.01em',
            color: color.ink,
            opacity: word,
            translate: `0 ${(1 - word) * 40}px`,
          }}
        >
          СПОРТБОТ
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
