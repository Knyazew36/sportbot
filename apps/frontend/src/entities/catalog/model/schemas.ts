import { z } from 'zod'

// «Ошибка в описании» — как CreateComplaintDto на бэке
export const complaintSchema = z.object({
  text: z.string().trim().min(3, 'Напиши, что не так').max(500, 'До 500 символов'),
})
export type ComplaintValues = z.infer<typeof complaintSchema>

// ── Форма упражнения: админ и правка от пользователя ────────────────────────

export const catalogNameSchema = z
  .string()
  .trim()
  .min(2, 'Название — от 2 символов')
  .max(60, 'Название — до 60 символов')
// Пустой текст — «нет текста»: на бэк уходит null, а не пустая строка
export const optionalTextSchema = (max: number) =>
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
const EQUIPMENT_VALUES = ['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'] as const

// Шаги и ошибки: в форме — строки useFieldArray (ему нужны объекты), на бэк — массив строк.
// Пустые строки, оставленные кнопкой «+ Добавить», отбрасываются
export const TEXT_LIST_MAX = 20
export const textListSchema = z
  .array(z.object({ value: z.string().trim().max(300, 'Пункт — до 300 символов') }))
  .max(TEXT_LIST_MAX, `До ${TEXT_LIST_MAX} пунктов`)
  .transform(items => items.map(item => item.value).filter(Boolean))
export type TextListInput = z.input<typeof textListSchema>

/** Список из API → строки формы */
export const toTextList = (items: string[] | undefined): TextListInput => (items ?? []).map(value => ({ value }))

// Упражнение справочника (business-tz, 5.2)
export const exerciseFormSchema = z.object({
  name: catalogNameSchema,
  technique: optionalTextSchema(2000),
  steps: textListSchema,
  mistakes: textListSchema,
  videoUrl,
  equipment: z.enum(EQUIPMENT_VALUES),
  // Чем меряется: повторы или время (кардио, планка)
  measure: z.enum(['REPS', 'TIME', 'MINUTES']),
  imagePath: z.string().nullable(),
  // Фото финиша загружает только админ
  imageEndPath: z.string().nullable().optional(),
  primary: z.array(z.number().int()).min(1, 'Нужна хотя бы одна основная мышца'),
  secondary: z.array(z.number().int()),
  jointIds: z.array(z.number().int()),
})
export type ExerciseFormInput = z.input<typeof exerciseFormSchema>
export type ExerciseFormValues = z.output<typeof exerciseFormSchema>

// Правка упражнения от пользователя: те же поля и комментарий для администратора.
// Инвентаря у записи может не быть, картинка не трогается, пока не загружена новая
export const exerciseProposalSchema = exerciseFormSchema.omit({ imageEndPath: true }).extend({
  equipment: z.enum(EQUIPMENT_VALUES).nullable(),
  imagePath: z.string().optional(),
  comment: z.string().trim().max(500, 'До 500 символов'),
})
export type ExerciseProposalInput = z.input<typeof exerciseProposalSchema>
export type ExerciseProposalValues = z.output<typeof exerciseProposalSchema>

// Новое упражнение из справочника: у пользователя уходит черновиком на модерацию, у админа — сразу в справочник.
// Инвентарь и картинку можно не указывать
export const exerciseCreateSchema = exerciseFormSchema.omit({ imageEndPath: true }).extend({
  equipment: z.enum(EQUIPMENT_VALUES).nullable(),
})
export type ExerciseCreateInput = z.input<typeof exerciseCreateSchema>
export type ExerciseCreateValues = z.output<typeof exerciseCreateSchema>

// ── Форма растяжки ──────────────────────────────────────────────────────────

// Растяжка справочника (business-tz, 5.3). Удержание вводится текстом — в форму числом не превращаем
export const stretchFormSchema = z.object({
  name: catalogNameSchema,
  howTo: optionalTextSchema(2000),
  steps: textListSchema,
  mistakes: textListSchema,
  holdSeconds: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, 'Удержание — целое число секунд')
    .transform(Number)
    .refine(v => v >= 5 && v <= 300, 'Удержание — от 5 до 300 секунд'),
  perSide: z.boolean(),
  kind: z.enum(['COOLDOWN', 'WARMUP']),
  imagePath: z.string().nullable(),
  imageEndPath: z.string().nullable().optional(),
  muscles: z.array(z.number().int()).min(1, 'Отметь хотя бы одну мышцу'),
})
export type StretchFormInput = z.input<typeof stretchFormSchema>
export type StretchFormValues = z.output<typeof stretchFormSchema>

// Правка растяжки от пользователя: тип «заминка / разминка» решает админ, картинка не трогается без новой
export const stretchProposalSchema = stretchFormSchema.omit({ kind: true, imageEndPath: true }).extend({
  imagePath: z.string().optional(),
  comment: z.string().trim().max(500, 'До 500 символов'),
})
export type StretchProposalInput = z.input<typeof stretchProposalSchema>
export type StretchProposalValues = z.output<typeof stretchProposalSchema>

// ── Картинка записи ─────────────────────────────────────────────────────────

// Те же ограничения, что у загрузки на бэке: проверяем до отправки, чтобы не гнать большой файл впустую
export const CATALOG_IMAGE_MAX_MB = 5
export const CATALOG_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const catalogImageFileSchema = z
  .instanceof(File)
  .refine(file => (CATALOG_IMAGE_TYPES as readonly string[]).includes(file.type), 'Только JPEG, PNG или WebP')
  .superRefine((file, ctx) => {
    if (file.size > CATALOG_IMAGE_MAX_MB * 1024 * 1024)
      ctx.addIssue({
        code: 'custom',
        message: `Файл ${(file.size / 1024 / 1024).toFixed(1)} МБ — нужно до ${CATALOG_IMAGE_MAX_MB} МБ`,
      })
  })
