import type { EndCardProps } from '@sportbot/render-contract'

import { Card } from '../components/Card'
import { font } from '../tokens'

import { paletteOf } from './palette'

/** Ход появления элементов, 0 → 1; press — нажатие плитки, 0 → 1 → 0. Нет — всё уже на месте */
export type EndCardMotion = { tile: number; title: number; sub: number; chip: number; press: number }

const SETTLED: EndCardMotion = { tile: 1, title: 1, sub: 1, chip: 1, press: 0 }

type Props = Pick<EndCardProps, 'fill'> & {
  /** Ширина кадра в px: от неё считаются шрифты и отступы. Ролик — 1080, превью — ширина контейнера */
  unit: number
  motion?: EndCardMotion
}

/** Вёрстка заставки без Remotion и без фона: её рендерит композиция EndCard и показывает превью в приложении */
export const EndCardContent = ({ fill, unit, motion = SETTLED }: Props) => {
  const tone = paletteOf(fill)
  // Размеры заданы под кадр 1080
  const px = (n: number) => (n * unit) / 1080
  const { tile, title, sub, chip, press } = motion

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: px(56), color: tone.ink }}>
      <div style={{ scale: String(0.4 + 0.6 * tile), opacity: tile }}>
        <Card
          fill={tone.fill}
          ink={tone.ink}
          scale={px(1.4)}
          press={press}
          style={{ width: px(230), height: px(230), display: 'grid', placeItems: 'center' }}
        >
          <svg
            width={px(110)}
            height={px(110)}
            viewBox='0 0 130 154'
          >
            <path
              d='M18 0L130 77L18 154Z'
              fill={tone.ink}
            />
          </svg>
        </Card>
      </div>
      <div
        style={{
          fontFamily: font.display,
          fontWeight: 600,
          fontSize: px(140),
          lineHeight: 1,
          opacity: title,
          translate: `0 ${(1 - title) * px(50)}px`,
        }}
      >
        СпортБот
      </div>
      <div
        style={{
          fontFamily: font.sans,
          fontSize: px(46),
          lineHeight: 1.3,
          textAlign: 'center',
          maxWidth: px(820),
          opacity: sub,
          translate: `0 ${(1 - sub) * px(30)}px`,
        }}
      >
        Программа с этим упражнением — бесплатно
      </div>
      {/* Выезжает на ширину кадра, а не свою: иначе тень выглядывает из-за края */}
      <div style={{ translate: `${(chip - 1) * unit}px 0` }}>
        <Card
          fill={tone.fill}
          ink={tone.ink}
          scale={px(1)}
          style={{
            padding: `${px(20)}px ${px(36)}px`,
            fontFamily: font.sans,
            fontWeight: 600,
            fontSize: px(46),
            whiteSpace: 'nowrap',
          }}
        >
          Найди «СпортБот» в Telegram и MAX
        </Card>
      </div>
    </div>
  )
}
