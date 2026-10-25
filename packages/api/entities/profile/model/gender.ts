/** classic — синяя расцветка Спортбота; rose — розовая. Ось независима от светлой/тёмной темы */
export type Palette = 'classic' | 'rose'

export type Gender = 'MALE' | 'FEMALE'

/** Расцветка по полу: выбор пола сразу перекрашивает, ручной выбор расцветки потом её переопределяет */
export const paletteForGender = (gender: Gender): Palette => (gender === 'FEMALE' ? 'rose' : 'classic')

// Подписи пола: шаг первого запуска и «Оформление» в профиле
export const GENDERS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Мужской' },
  { value: 'FEMALE', label: 'Женский' },
]
