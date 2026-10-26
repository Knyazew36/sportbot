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

// Шаг 2: писать ли вообще. Без значения по умолчанию: вопросы и напоминания нравятся не всем
export const onboardingRemindSchema = z.object({
  remind: z.enum(['yes', 'no'], { message: 'Выбери, напоминать ли' }),
})
export type OnboardingRemindValues = z.infer<typeof onboardingRemindSchema>

// Шаг 2, если напоминать: время вопросов бота и повторять ли их без ответа
export const onboardingTimesSchema = z.object({
  morningTime: z.string().trim().regex(TIME, 'Время в формате ЧЧ:ММ'),
  eveningTime: z.string().trim().regex(TIME, 'Время в формате ЧЧ:ММ'),
  askMode: z.enum(['remind', 'once'], { message: 'Выбери, повторять ли' }),
})
export type OnboardingTimesValues = z.infer<typeof onboardingTimesSchema>

// «Не писать» выбирают на экране «Напоминать?», а не среди режимов времени
export type AskMode = OnboardingTimesValues['askMode'] | 'off'

// Один выбор на экране — два флага в API. При «не писать» напоминания не трогаем
export const ASK_MODE_FIELDS: Record<AskMode, { questionsEnabled: boolean; remindersEnabled?: boolean }> = {
  remind: { questionsEnabled: true, remindersEnabled: true },
  once: { questionsEnabled: true, remindersEnabled: false },
  off: { questionsEnabled: false },
}

// Шаг 3: шаблон по id или «с нуля»
export const onboardingProgramSchema = z.object({
  choice: z.union([z.number().int(), z.literal('scratch')]),
})
export type OnboardingProgramValues = z.infer<typeof onboardingProgramSchema>
