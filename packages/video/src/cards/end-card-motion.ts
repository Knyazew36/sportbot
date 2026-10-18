import tokens from '@sportbot/brand/tokens.json'

import type { EndCardMotion } from './EndCardContent'

// Без Remotion: тот же расчёт кадров нужен ролику и превью в приложении, а фронт Remotion не тянет

/** Кадры появления: лист, плитка, название, строка, кнопка поиска. Нажатие плитки — когда всё на месте */
export const END_CARD_TIMING = { sheet: 0, tile: 5, title: 12, sub: 18, chip: 24, chipEnd: 36, press: 42 } as const

/** Кадр, к которому заставка полностью успокоилась: нажатие плитки отыграло */
export const END_CARD_SETTLED_FRAME = END_CARD_TIMING.press + 10

// cubic-bezier из CSS: x(s) обращаем Ньютоном, как браузер и Easing.bezier в Remotion
const bezier = (css: string) => {
  const [x1, y1, x2, y2] = css.match(/-?[\d.]+/g)!.map(Number) as [number, number, number, number]
  const curve = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3
  const slope = (a: number, b: number, s: number) => 3 * a * (1 - s) ** 2 + 6 * (b - a) * s * (1 - s) + 3 * (1 - b) * s ** 2
  return (t: number) => {
    if (t <= 0 || t >= 1) return t
    let s = t
    for (let i = 0; i < 8; i++) {
      const d = slope(x1, x2, s)
      if (Math.abs(d) < 1e-6) break
      s -= (curve(x1, x2, s) - t) / d
    }
    return curve(y1, y2, Math.min(1, Math.max(0, s)))
  }
}

const enter = bezier(tokens.motion.ease.enter)

// Кусочная интерполяция с кривой на каждом отрезке и зажимом по краям — как interpolate в Remotion
const tween = (frame: number, input: number[], output: number[]) => {
  if (frame <= input[0]!) return output[0]!
  for (let i = 1; i < input.length; i++) {
    if (frame > input[i]!) continue
    const t = enter((frame - input[i - 1]!) / (input[i]! - input[i - 1]!))
    return output[i - 1]! + (output[i]! - output[i - 1]!) * t
  }
  return output[output.length - 1]!
}

/** Появление: 0 → 1 за frames кадров начиная со start */
export const enterAt = (frame: number, start: number, frames = 10) => tween(frame, [start, start + frames], [0, 1])

// Фирменное «нажатие»: плитка уходит в тень и отскакивает, как кнопка в приложении
const pressAt = (frame: number, start: number) => tween(frame, [start, start + 4, start + 10], [0, 1, 0])

/** Ход элементов заставки на кадре: им двигают и ролик, и превью */
export const endCardMotion = (frame: number): EndCardMotion => {
  const t = END_CARD_TIMING
  return {
    tile: enterAt(frame, t.tile),
    title: enterAt(frame, t.title),
    sub: enterAt(frame, t.sub),
    chip: enterAt(frame, t.chip, t.chipEnd - t.chip),
    press: pressAt(frame, t.press),
  }
}
