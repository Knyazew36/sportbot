import { z } from 'zod'

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
  tagIds: z.array(z.number()),
})
export type TemplateMetaValues = z.infer<typeof templateMetaSchema>

const tagCode = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Укажи код')
  .max(40, 'Код — до 40 символов')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Латиница, цифры и дефис: home, gym, full-body')

// Тег шаблона: код — ключ импорта, название — подпись чипа, группа — ряд чипов
export const programTagSchema = z.object({
  code: tagCode,
  name: z.string().trim().min(1, 'Название не может быть пустым').max(24, 'Название — до 24 символов'),
  groupId: z.number({ message: 'Выбери группу' }),
})
export type ProgramTagValues = z.infer<typeof programTagSchema>

// Группа тегов: код — параметр фильтра в ссылке каталога, «q» там уже занят поиском
export const programTagGroupSchema = z.object({
  code: tagCode.refine(code => code !== 'q', 'Код «q» занят поиском'),
  name: z.string().trim().min(1, 'Название не может быть пустым').max(24, 'Название — до 24 символов'),
})
export type ProgramTagGroupValues = z.infer<typeof programTagGroupSchema>

// Отказ по жалобе или правке: причина необязательна, но уходит автору
export const rejectComplaintSchema = z.object({
  reason: z.string().trim().max(200, 'До 200 символов'),
})
export type RejectComplaintValues = z.infer<typeof rejectComplaintSchema>
