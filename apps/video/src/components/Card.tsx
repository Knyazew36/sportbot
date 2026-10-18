import type { CSSProperties, ReactNode } from 'react'

import { color, lift, line } from '../brand'

type Props = {
  children: ReactNode
  fill?: string
  /** 0 — на месте, 1 — вдавлена в тень */
  press?: number
  style?: CSSProperties
}

// Плитка приложения: чёрная обводка и жёсткая тень вправо-вниз без размытия
export const Card = ({ children, fill = color.mint, press = 0, style }: Props) => (
  <div
    style={{
      background: fill,
      border: `${line}px solid ${color.ink}`,
      boxShadow: `${lift * (1 - press)}px ${lift * (1 - press)}px 0 ${color.ink}`,
      translate: `${lift * press}px ${lift * press}px`,
      ...style,
    }}
  >
    {children}
  </div>
)
