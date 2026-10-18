import { color } from '../brand'

type Props = {
  size: number
  /** 0 — плитка на месте, 1 — вдавлена в тень, как кнопка приложения при нажатии */
  press?: number
  /** Масштаб треугольника «старт», 0…1 */
  play?: number
}

// Геометрия из packages/brand/logo/icon.svg
export const Mark = ({ size, press = 0, play = 1 }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 512 512'
  >
    <rect
      x={94}
      y={94}
      width={350}
      height={350}
      fill={color.ink}
      stroke={color.ink}
      strokeWidth={12}
    />
    <g transform={`translate(${press * 24} ${press * 24})`}>
      <rect
        x={70}
        y={70}
        width={350}
        height={350}
        fill={color.mint}
        stroke={color.ink}
        strokeWidth={12}
      />
      <path
        d='M196 168L326 245L196 322Z'
        fill={color.ink}
        transform={`translate(240 245) scale(${play}) translate(-240 -245)`}
      />
    </g>
  </svg>
)
