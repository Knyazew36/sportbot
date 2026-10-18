import tokens from '@sportbot/brand/tokens.json'
import { Easing } from 'remotion'

export const color = { ...tokens.color.light, ...tokens.color.accent }
// Розовая расцветка приложения: blue здесь малиновый «голос палитры»
export const rose = tokens.color.rose
export const roseDark = tokens.color.roseDark
export const font = {
  display: `'Oswald Variable', 'Arial Narrow', sans-serif`,
  sans: `'Onest Variable', system-ui, sans-serif`,
}

// cubic-bezier(...) из токенов → Easing Remotion
const bezier = (css: string) => {
  const [x1, y1, x2, y2] = css.match(/-?[\d.]+/g)!.map(Number)
  return Easing.bezier(x1, y1, x2, y2)
}
export const ease = {
  enter: bezier(tokens.motion.ease.enter),
  exit: bezier(tokens.motion.ease.exit),
}

// Обводка и жёсткая тень как в приложении (1.5px и 3–6px), пересчитаны под кадр 1080
export const line = 6
export const lift = 18

export const formats = tokens.video
