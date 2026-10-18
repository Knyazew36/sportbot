import type { CSSProperties, ReactNode } from 'react'

import { color, lift, line } from '../brand'

type Props = {
  children: ReactNode
  fill?: string
  /** Цвет обводки и тени; в розовой расцветке — её чернила */
  ink?: string
  /** 0 — на месте, 1 — вдавлена в тень */
  press?: number
  style?: CSSProperties
}

// Плитка приложения: чёрная обводка и жёсткая тень вправо-вниз без размытия
export const Card = ({ children, fill = color.mint, ink = color.ink, press = 0, style }: Props) => (
  <div
    style={{
      background: fill,
      border: `${line}px solid ${ink}`,
      boxShadow: `${lift * (1 - press)}px ${lift * (1 - press)}px 0 ${ink}`,
      translate: `${lift * press}px ${lift * press}px`,
      ...style,
    }}
  >
    {children}
  </div>
)
