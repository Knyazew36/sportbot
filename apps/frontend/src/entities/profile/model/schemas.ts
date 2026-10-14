import { z } from 'zod'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

// Расписание: дни 0..6 (0 — воскресенье) и время вопросов бота
export const scheduleSchema = z.object({
  trainingDays: z.array(z.number().int().min(0).max(6)).min(1, 'Выбери хотя бы один день'),
  morningTime: z.string().trim().regex(TIME, 'Время в формате ЧЧ:ММ'),
  eveningTime: z.string().trim().regex(TIME, 'Время в формате ЧЧ:ММ'),
})
export type ScheduleValues = z.infer<typeof scheduleSchema>

// Часовой пояс: город из списка или текущее время на часах — пояс посчитает бэк
export const timezoneSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('city'), zone: z.string().min(1, 'Выбери город') }),
  z.object({ mode: z.literal('time'), localTime: z.string().trim().regex(TIME, 'Время в формате ЧЧ:ММ') }),
])
export type TimezoneValues = z.infer<typeof timezoneSchema>

// Срок «до даты» или «до отмены»: у паузы и у ограничения по суставу
const term = {
  term: z.enum(['date', 'forever']),
  endDate: z.string(),
}
const requireDate = (v: { term: 'date' | 'forever'; endDate: string }) => v.term === 'forever' || DATE.test(v.endDate)
const DATE_ERROR = { message: 'Выбери дату', path: ['endDate'] }

export const pauseSchema = z
  .object(term)
  .refine(requireDate, DATE_ERROR)
  .transform(v => (v.term === 'date' ? v.endDate : null))
export type PauseInput = z.input<typeof pauseSchema>

export const limitationSchema = z
  .object({ jointId: z.number().int().positive('Выбери зону'), ...term })
  .refine(requireDate, DATE_ERROR)
  .transform(v => ({ jointId: v.jointId, endDate: v.term === 'date' ? v.endDate : null }))
export type LimitationInput = z.input<typeof limitationSchema>
export type LimitationValues = z.output<typeof limitationSchema>

// Вес тела: запятая — как точка
export const bodyWeightSchema = z.object({
  value: z
    .string()
    .trim()
    .transform(v => v.replace(',', '.'))
    .refine(v => /^\d{2,3}(\.\d{1,2})?$/.test(v), 'Вес — число, до двух знаков после точки')
    .transform(Number)
    .refine(v => v >= 20 && v <= 400, 'Вес — от 20 до 400 кг'),
})
export type BodyWeightInput = z.input<typeof bodyWeightSchema>
export type BodyWeightValues = z.output<typeof bodyWeightSchema>

export const displayNameSchema = z.object({
  displayName: z.string().trim().min(1, 'Имя не может быть пустым').max(64, 'Имя — до 64 символов'),
})
export type DisplayNameValues = z.infer<typeof displayNameSchema>
