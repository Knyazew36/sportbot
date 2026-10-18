import tokens from '@sportbot/brand/tokens.json'

// Токены без Remotion: их берут и композиции, и карточки, которые фронт рисует без плеера

export const color = { ...tokens.color.light, ...tokens.color.accent }
export const dark = tokens.color.dark
// Розовая расцветка приложения: blue здесь малиновый «голос палитры»
export const rose = tokens.color.rose
export const roseDark = tokens.color.roseDark
export const font = {
  display: `'Oswald Variable', 'Arial Narrow', sans-serif`,
  sans: `'Onest Variable', system-ui, sans-serif`,
}

// Обводка и жёсткая тень как в приложении (1.5px и 3–6px), пересчитаны под кадр 1080
export const line = 6
export const lift = 18

export const formats = tokens.video
