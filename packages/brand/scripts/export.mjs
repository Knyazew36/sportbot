// Экспорт PNG из SVG-знака: node scripts/export.mjs
import { Resvg } from '@resvg/resvg-js'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const out = new URL('export/', root)
mkdirSync(out, { recursive: true })

const targets = [
  ['logo/icon.svg', 'icon-1024.png', 1024],
  // Instagram и Telegram режут аватарку в круг и не держат прозрачность: плитка сама становится фоном
  ['logo/avatar.svg', 'avatar-1080.png', 1080],
  // iOS заливает прозрачное в apple-touch чёрным — чёрный треугольник пропал бы, поэтому плитка аватарки
  ['logo/avatar.svg', 'apple-touch-icon-180.png', 180],
  // Фавиконки — знак аватарки без плитки
  ['logo/mark.svg', 'mark-1024.png', 1024],
  ['logo/mark.svg', 'favicon-32.png', 32],
  ['logo/mark.svg', 'favicon-16.png', 16],
  ['logo/icon-transparent.svg', 'icon-transparent-1024.png', 1024], // оверлей в видео
]

for (const [src, name, size] of targets) {
  const svg = readFileSync(new URL(src, root))
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
  writeFileSync(new URL(name, out), png)
  console.log(`${name} ${size}px`)
}
