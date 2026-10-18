import type { CSSProperties, ReactNode } from 'react'

import { color, lift, line } from '../tokens'

type Props = {
  children: ReactNode
  fill?: string
  /** Цвет обводки и тени; в розовой расцветке — её чернила */
  ink?: string
  /** 0 — на месте, 1 — вдавлена в тень */
  press?: number
  /** Обводка и тень заданы под кадр 1080; превью меньше — уменьшаем их вместе с остальным */
  scale?: number
  style?: CSSProperties
}

// Плитка приложения: чёрная обводка и жёсткая тень вправо-вниз без размытия
export const Card = ({ children, fill = color.mint, ink = color.ink, press = 0, scale = 1, style }: Props) => {
  const offset = lift * scale
  return (
    <div
      style={{
        background: fill,
        border: `${line * scale}px solid ${ink}`,
        boxShadow: `${offset * (1 - press)}px ${offset * (1 - press)}px 0 ${ink}`,
        translate: `${offset * press}px ${offset * press}px`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
