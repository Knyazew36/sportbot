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

// Ввод круга суперсета: строка на участника. «Не делал» — строка не проверяется и подход не пишется.
// Вес обязателен, кроме упражнений с собственным весом: подставить его не из чего, а 0 молча исказил бы историю
const roundRow = z
  .object({
    itemId: z.number(),
    bodyweight: z.boolean(),
    skip: z.boolean(),
    weight: z.string(),
    reps: z.string(),
  })
  .superRefine((row, ctx) => {
    if (row.skip) return
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
    weight: row.skip ? 0 : weight.parse(row.weight),
    reps: row.skip ? 0 : reps.parse(row.reps),
  }))

export const roundEntrySchema = z
  .object({ rows: z.array(roundRow) })
  .refine(v => v.rows.some(r => !r.skip), { message: 'Отметь хотя бы одно упражнение', path: ['rows'] })

export type RoundEntryInput = z.input<typeof roundEntrySchema>
export type RoundEntryValues = z.output<typeof roundEntrySchema>
