import type { PluralForms } from '@front-cmdt/utils/pluralize'

// Формы слов для pluralize из @front-cmdt/utils: [для 1, для 2–4, для 5–20]

export const EXERCISE_FORMS: PluralForms = ['упражнение', 'упражнения', 'упражнений']
export const SET_FORMS: PluralForms = ['подход', 'подхода', 'подходов']
export const DAY_FORMS: PluralForms = ['день', 'дня', 'дней']
export const WORKOUT_FORMS: PluralForms = ['тренировка', 'тренировки', 'тренировок']
export const PROGRAM_FORMS: PluralForms = ['программа', 'программы', 'программ']

/** После «из»: «из 1 упражнения», «из 5 упражнений» */
export const EXERCISE_OF_FORMS: PluralForms = ['упражнения', 'упражнений', 'упражнений']
