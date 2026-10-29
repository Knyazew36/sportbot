import { z } from 'zod'

import { type Measure, MEASURE_LIMITS, parseTime } from '../../../lib/measure'

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

// Подход на время: у удержания «45» — секунды, у кардио «20» — минуты; «мм:сс» понимают обе.
// В подходе reps — секунды, веса нет
const seconds = (measure: Measure) =>
  z
    .string()
    .trim()
    .min(1, 'Сколько по времени?')
    .transform((v, ctx) => {
      const value = parseTime(measure, v)
      if (value === null || value < 1 || value > MEASURE_LIMITS[measure].set) {
        ctx.addIssue({
          code: 'custom',
          message: measure === 'MINUTES' ? 'Минуты — число, до 4 часов' : 'Время — секунды или мм:сс, до 4 часов',
        })
        return z.NEVER
      }
      return value
    })

export const timeSetSchema = (measure: Measure) =>
  z.object({ time: seconds(measure) }).transform(v => ({ weight: 0, reps: v.time }))

export type TimeSetInput = z.input<ReturnType<typeof timeSetSchema>>

// Ввод круга суперсета: строка на участника. «Не делал» — строка не проверяется и подход не пишется.
// Вес обязателен, кроме упражнений с собственным весом: подставить его не из чего, а 0 молча исказил бы историю
// У упражнения на время поле reps — время по мере (секунды или минуты), веса нет
const roundRow = z
  .object({
    itemId: z.number(),
    bodyweight: z.boolean(),
    measure: z.enum(['REPS', 'TIME', 'MINUTES']),
    skip: z.boolean(),
    weight: z.string(),
    reps: z.string(),
  })
  .superRefine((row, ctx) => {
    if (row.skip) return
    if (row.measure !== 'REPS') {
      const parsed = seconds(row.measure).safeParse(row.reps)
      if (!parsed.success) ctx.addIssue({ code: 'custom', path: ['reps'], message: parsed.error.issues[0]!.message })
      return
    }
    if (!row.bodyweight && row.weight.trim() === '')
      ctx.addIssue({ code: 'custom', path: ['weight'], message: 'Сколько вес?' })
    for (const [path, schema] of [
      ['weight', weight],
      ['reps', reps],
    ] as const) {
      const parsed = schema.safeParse(row[path])
      if (!parsed.success) ctx.addIssue({ code: 'custom', path: [path], message: parsed.error.issues[0]!.message })
    }
  })
  .transform(row => ({
    itemId: row.itemId,
    skip: row.skip,
    weight: row.skip || row.measure !== 'REPS' ? 0 : weight.parse(row.weight),
    reps: row.skip ? 0 : row.measure !== 'REPS' ? seconds(row.measure).parse(row.reps) : reps.parse(row.reps),
  }))

export const roundEntrySchema = z
  .object({ rows: z.array(roundRow) })
  .refine(v => v.rows.some(r => !r.skip), { message: 'Отметь хотя бы одно упражнение', path: ['rows'] })

export type RoundEntryInput = z.input<typeof roundEntrySchema>
export type RoundEntryValues = z.output<typeof roundEntrySchema>

// Ручная тренировка из статистики: день — сегодня или прошлый (today — «2026-10-29» по поясу человека),
// тренировка — комплекс активной программы. Подходы дописываются потом на экране исправления
export const manualWorkoutSchema = (today: string) =>
  z.object({
    date: z
      .string()
      .min(1, 'Выбери день')
      .refine(v => v <= today, 'Тренировку в будущем добавить нельзя'),
    complexId: z.number({ message: 'Выбери тренировку' }),
  })

export type ManualWorkoutInput = z.input<ReturnType<typeof manualWorkoutSchema>>
export type ManualWorkoutValues = z.output<ReturnType<typeof manualWorkoutSchema>>
