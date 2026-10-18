import tokens from '@sportbot/brand/tokens.json'
import { Easing } from 'remotion'

export * from './tokens'

// cubic-bezier(...) из токенов → Easing Remotion
const bezier = (css: string) => {
  const [x1, y1, x2, y2] = css.match(/-?[\d.]+/g)!.map(Number)
  return Easing.bezier(x1, y1, x2, y2)
}
export const ease = {
  enter: bezier(tokens.motion.ease.enter),
  exit: bezier(tokens.motion.ease.exit),
}
