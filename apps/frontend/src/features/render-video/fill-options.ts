import type { LowerThirdProps } from '@sportbot/render-contract'

/** Заливки роликов для переключателя в форме: у плашки и заставки один набор */
export const FILL_OPTIONS: { value: LowerThirdProps['fill']; label: string }[] = [
  { value: 'mint', label: 'Мята' },
  { value: 'rest', label: 'Абрикос' },
  { value: 'blue', label: 'Синяя' },
  { value: 'rose', label: 'Розовая' },
]

/** Длительности ролика для переключателя: 3 → «3 с» */
export const secondsOptions = (seconds: readonly number[]) => seconds.map(s => ({ value: String(s), label: `${s} с` }))
