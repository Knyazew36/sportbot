import { z } from 'zod'

// «Ошибка в описании» — как CreateComplaintDto на бэке
export const complaintSchema = z.object({
  text: z.string().trim().min(3, 'Напиши, что не так').max(500, 'До 500 символов'),
})
export type ComplaintValues = z.infer<typeof complaintSchema>

// Мастер своей записи (business-tz, 5.5): шаг 1 — название, 2 — мышцы и удержание, 3 — подробности
export const draftSchema = z.object({
  kind: z.enum(['exercise', 'stretch']),
  name: z.string().trim().min(2, 'Название — от 2 символов').max(60, 'Название — до 60 символов'),
  primary: z.array(z.number().int()).min(1, 'Отметь хотя бы одну мышцу'),
  holdSeconds: z.number().int().min(5).max(300),
  perSide: z.boolean(),
  technique: z
    .string()
    .trim()
    .max(2000, 'До 2000 символов')
    .transform(v => v || undefined),
  videoUrl: z
    .string()
    .trim()
    .refine(v => v === '' || /^https?:\/\/\S+\.\S+/.test(v), 'Ссылка на видео — полный адрес https://…')
    .transform(v => v || undefined),
})
export type DraftInput = z.input<typeof draftSchema>
export type DraftValues = z.output<typeof draftSchema>

/** Поля каждого шага мастера: «Дальше» проверяет только их */
export const DRAFT_STEP_FIELDS: (keyof DraftInput)[][] = [
  ['name'],
  ['primary', 'holdSeconds', 'perSide'],
  ['technique', 'videoUrl'],
]
