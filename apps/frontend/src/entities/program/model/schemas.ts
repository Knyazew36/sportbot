import { z } from 'zod'

// Названия программы и комплекса — как в CreateProgramDto / CreateComplexDto на бэке
const name = z.string().trim().min(1, 'Название не может быть пустым').max(60, 'Название — до 60 символов')

export const programNameSchema = z.object({ name })
export type ProgramNameValues = z.infer<typeof programNameSchema>

export const complexNameSchema = z.object({ name })
export type ComplexNameValues = z.infer<typeof complexNameSchema>

// Поля открываются строками из инпутов; в число превращаем тут, а не в submit
const count = (label: string, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, `${label} — целое число`)
    .transform(Number)
    .refine(v => v >= 1 && v <= max, `${label} — от 1 до ${max}`)

// План упражнения в комплексе: «3 × 8–12»
export const complexExerciseSchema = z
  .object({
    sets: count('Подходы', 20),
    repsMin: count('Повторы', 200),
    repsMax: count('Повторы', 200),
  })
  .refine(v => v.repsMin <= v.repsMax, { message: 'Диапазон повторов: от меньшего к большему', path: ['repsMax'] })

export type ComplexExerciseInput = z.input<typeof complexExerciseSchema>
export type ComplexExerciseValues = z.output<typeof complexExerciseSchema>

// Публикация в каталог — как PublishProgramDto на бэке. Свой тег — новый, ещё без id
const ownTag = z.object({
  groupId: z.number(),
  name: z.string().trim().min(2, 'Тег — от 2 символов').max(24, 'Тег — до 24 символов'),
})

/** Своих тегов на проверке у программы — не больше */
export const OWN_TAGS_MAX = 3

/**
 * Форма публикации. Группы тегов приходят с сервера, поэтому схема собирается под них:
 * в каждой группе — тег справочника или свой
 */
export const publishProgramSchema = (groups: { id: number; name: string; tagIds: number[] }[]) =>
  z
    .object({
      description: z
        .string()
        .trim()
        .min(20, 'Опиши программу хотя бы в 20 символов')
        .max(1000, 'Описание — до 1000 символов'),
      tagIds: z.array(z.number()),
      newTags: z.array(ownTag).max(OWN_TAGS_MAX, `Своих тегов — не больше ${OWN_TAGS_MAX}`),
    })
    .superRefine((v, ctx) => {
      const empty = groups.filter(
        g => !v.tagIds.some(id => g.tagIds.includes(id)) && !v.newTags.some(t => t.groupId === g.id),
      )
      if (empty.length)
        ctx.addIssue({
          code: 'custom',
          path: ['tagIds'],
          message: `Выбери тег в группах: ${empty.map(g => g.name).join(', ')}`,
        })
    })

export type PublishProgramValues = z.infer<ReturnType<typeof publishProgramSchema>>
