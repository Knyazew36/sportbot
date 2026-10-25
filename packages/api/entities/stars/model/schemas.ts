import { z } from 'zod'

export const STARS_MIN = 1
export const STARS_MAX = 10000

// Сумма звёзд: пресет кладёт число строкой в то же поле, что и ручной ввод
export const starsAmountSchema = z.object({
  amount: z
    .string()
    .trim()
    .refine(v => /^\d+$/.test(v), 'Сумма — целое число звёзд')
    .transform(Number)
    .refine(v => v >= STARS_MIN && v <= STARS_MAX, `От ${STARS_MIN} до ${STARS_MAX} звёзд`),
})
export type StarsAmountInput = z.input<typeof starsAmountSchema>
export type StarsAmountValues = z.output<typeof starsAmountSchema>
