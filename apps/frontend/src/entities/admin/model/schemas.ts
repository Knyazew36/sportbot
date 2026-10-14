import { z } from 'zod'

const name = z.string().trim().min(2, 'Название — от 2 символов').max(60, 'Название — до 60 символов')
// Пустой текст — «нет текста»: на бэк уходит null, а не пустая строка
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `До ${max} символов`)
    .transform(v => v || null)
const videoUrl = z
  .string()
  .trim()
  .refine(v => v === '' || /^https?:\/\/\S+\.\S+/.test(v), 'Ссылка на видео — полный адрес https://…')
  .transform(v => v || null)

// Запись справочника: упражнение (business-tz, 5.2)
export const exerciseFormSchema = z.object({
  name,
  technique: optionalText(2000),
  videoUrl,
  equipment: z.enum(['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT']),
  imagePath: z.string().nullable(),
  primary: z.array(z.number().int()).min(1, 'Нужна хотя бы одна основная мышца'),
  secondary: z.array(z.number().int()),
  jointIds: z.array(z.number().int()),
})
export type ExerciseFormInput = z.input<typeof exerciseFormSchema>
export type ExerciseFormValues = z.output<typeof exerciseFormSchema>

// Растяжка (business-tz, 5.3)
export const stretchFormSchema = z.object({
  name,
  howTo: optionalText(2000),
  holdSeconds: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, 'Удержание — целое число секунд')
    .transform(Number)
    .refine(v => v >= 5 && v <= 300, 'Удержание — от 5 до 300 секунд'),
  perSide: z.boolean(),
  kind: z.enum(['COOLDOWN', 'WARMUP']),
  imagePath: z.string().nullable(),
  muscles: z.array(z.number().int()).min(1, 'Отметь хотя бы одну мышцу'),
})
export type StretchFormInput = z.input<typeof stretchFormSchema>
export type StretchFormValues = z.output<typeof stretchFormSchema>

// Исход заявки (business-tz, 5.6): отказу и дублю нужна причина, дублю — запись справочника
export const moderationSchema = z
  .object({
    outcome: z.enum(['approve', 'edit', 'duplicate', 'reject']),
    reason: z.string().trim().max(200, 'До 200 символов'),
    targetId: z.number().int().nullable(),
    // «Одобрить с правками»: что админ дописал
    text: z.string().trim().max(2000, 'До 2000 символов'),
    imagePath: z.string().nullable(),
    equipment: z.enum(['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT']).nullable(),
    jointIds: z.array(z.number().int()),
  })
  .refine(v => v.outcome !== 'reject' || v.reason.length >= 2, { message: 'Напиши причину', path: ['reason'] })
  .refine(v => v.outcome !== 'duplicate' || v.targetId != null, {
    message: 'Выбери запись, которой заменить черновик',
    path: ['targetId'],
  })
export type ModerationValues = z.infer<typeof moderationSchema>

// Шаблон: название и описание для экрана «Шаблоны» у пользователя
export const templateMetaSchema = z.object({
  name: z.string().trim().min(1, 'Название не может быть пустым').max(60, 'Название — до 60 символов'),
  description: z.string().trim().max(1000, 'До 1000 символов'),
})
export type TemplateMetaValues = z.infer<typeof templateMetaSchema>
