import type { LowerThirdProps } from '@sportbot/render-contract'

import { Card } from '../components/Card'
import { font } from '../tokens'

import { paletteOf } from './palette'

type Props = Pick<LowerThirdProps, 'title' | 'subtitle' | 'fill'> & {
  /** Ширина кадра в px: от неё считаются шрифты и отступы. Ролик — 1080, превью — ширина контейнера */
  unit: number
  /** Подпись проявляется отдельно: композиция анимирует её кадрами, фронт — CSS */
  subtitleOpacity?: number
}

/** Вёрстка плашки без Remotion: её рендерит композиция LowerThird и показывает превью в приложении. */
export const LowerThirdCard = ({ title, subtitle, fill, unit, subtitleOpacity = 1 }: Props) => {
  const tone = paletteOf(fill)
  // Обводка и тень заданы под кадр 1080 — в превью уменьшаются вместе с остальным
  const scale = unit / 1080

  return (
    <Card
      fill={tone.fill}
      ink={tone.ink}
      scale={scale}
      style={{ padding: `${unit * 0.026}px ${unit * 0.034}px` }}
    >
      <div style={{ fontFamily: font.sans, fontWeight: 600, fontSize: unit * 0.05, lineHeight: 1.15, color: tone.ink }}>
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontFamily: font.sans,
            fontSize: unit * 0.034,
            lineHeight: 1.3,
            marginTop: unit * 0.01,
            color: tone.ink,
            opacity: 0.7 * subtitleOpacity,
          }}
        >
          {subtitle}
        </div>
      )}
    </Card>
  )
}
