import { z } from 'zod'

// Поля открываются пустыми; пусто в весе — без веса (собственный вес). Запятая — как точка
const weight = z
  .string()
  .trim()
  .transform(v => v.replace(',', '.'))
  .refine(v => v === '' || /^\d{1,3}(\.\d{1,2})?$/.test(v), 'Вес — число до 999, до двух знаков после точки')
  .transform(v => (v === '' ? 0 : Number(v)))

const reps = z
  .string()
  .trim()
  .min(1, 'Сколько повторов?')
  .regex(/^\d{1,3}$/, 'Повторы — целое число')
  .transform(Number)
  .refine(v => v >= 1, 'Хотя бы 1 повтор')

export const workoutSetSchema = z.object({ weight, reps })

export type WorkoutSetInput = z.input<typeof workoutSetSchema>
export type WorkoutSetValues = z.output<typeof workoutSetSchema>
