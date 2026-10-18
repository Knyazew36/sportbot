// Экспорт PNG из SVG-знака: node scripts/export.mjs
import { Resvg } from '@resvg/resvg-js'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const out = new URL('export/', root)
mkdirSync(out, { recursive: true })

const targets = [
  ['logo/icon.svg', 'icon-1024.png', 1024],
  ['logo/icon.svg', 'avatar-1080.png', 1080], // Instagram, Telegram
  ['logo/icon.svg', 'apple-touch-icon-180.png', 180],
  ['logo/icon.svg', 'favicon-32.png', 32],
  ['logo/icon.svg', 'favicon-16.png', 16],
  ['logo/icon-transparent.svg', 'icon-transparent-1024.png', 1024], // оверлей в видео
]

for (const [src, name, size] of targets) {
  const svg = readFileSync(new URL(src, root))
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
  writeFileSync(new URL(name, out), png)
  console.log(`${name} ${size}px`)
}
