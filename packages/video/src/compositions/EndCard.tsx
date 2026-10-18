import type { EndCardProps } from '@sportbot/render-contract'
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'

import { ease } from '../brand'
import { EndCardContent } from '../cards/EndCardContent'
import { paletteOf } from '../cards/palette'
import { Background, CHROMA } from '../components/Background'

export type { EndCardProps }

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

/** Кадры появления: лист, плитка, название, строка, кнопка поиска. Нажатие плитки — когда всё на месте */
export const END_CARD_TIMING = { sheet: 0, tile: 5, title: 12, sub: 18, chip: 24, chipEnd: 36, press: 42 } as const

// Появление: 0 → 1 за frames кадров начиная со start, кривая enter из брендбука
const enterAt = (frame: number, start: number, frames = 10) =>
  interpolate(frame, [start, start + frames], [0, 1], { easing: ease.enter, ...clamp })

// Фирменное «нажатие»: плитка уходит в тень и отскакивает, как кнопка в приложении
const pressAt = (frame: number, start: number) =>
  interpolate(frame, [start, start + 4, start + 10], [0, 1, 0], { easing: ease.enter, ...clamp })

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
  const t = END_CARD_TIMING

  const sheet = background === 'paper' ? 1 : enterAt(frame, t.sheet, 9)
  const motion = {
    tile: enterAt(frame, t.tile),
    title: enterAt(frame, t.title),
    sub: enterAt(frame, t.sub),
    chip: enterAt(frame, t.chip, t.chipEnd - t.chip),
    press: pressAt(frame, t.press),
  }

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
          motion={motion}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
