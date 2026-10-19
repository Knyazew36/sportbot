import { z } from 'zod'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

// Шаг 0 (только приложение): пол — от него расцветка
export const onboardingGenderSchema = z.object({
  gender: z.enum(['MALE', 'FEMALE'], { message: 'Выбери пол' }),
})
export type OnboardingGenderValues = z.infer<typeof onboardingGenderSchema>

// Шаг 1: тренировочные дни, 0..6, 0 — воскресенье
export const onboardingDaysSchema = z.object({
  trainingDays: z.array(z.number().int().min(0).max(6)).min(1, 'Выбери хотя бы один день'),
})
export type OnboardingDaysValues = z.infer<typeof onboardingDaysSchema>

// Шаг 2: время вопросов бота
export const onboardingTimesSchema = z.object({
  morningTime: z.string().trim().regex(TIME, 'Время в формате ЧЧ:ММ'),
  eveningTime: z.string().trim().regex(TIME, 'Время в формате ЧЧ:ММ'),
  // Без значения по умолчанию: напоминания нравятся не всем, выбор делает сам пользователь
  remindersEnabled: z.boolean({ message: 'Выбери, напоминать или нет' }),
})
export type OnboardingTimesValues = z.infer<typeof onboardingTimesSchema>

// Шаг 3: шаблон по id или «с нуля»
export const onboardingProgramSchema = z.object({
  choice: z.union([z.number().int(), z.literal('scratch')]),
})
export type OnboardingProgramValues = z.infer<typeof onboardingProgramSchema>
