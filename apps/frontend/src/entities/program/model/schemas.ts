import { z } from 'zod'

import { MEASURE_LIMITS, parseTime } from '@/shared/lib/measure'

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

// Время в плане удержания: «45» — секунды, «1:30» — минуты и секунды; на бэк уходят секунды
const duration = z.string().transform((v, ctx) => {
  const seconds = parseTime('TIME', v)
  if (seconds === null || seconds < 1 || seconds > MEASURE_LIMITS.TIME.plan) {
    ctx.addIssue({ code: 'custom', message: 'Время — секунды или мм:сс, до 4 часов' })
    return z.NEVER
  }
  return seconds
})

// План удержания: «3 × 30–60 с»
export const complexExerciseTimeSchema = z
  .object({ sets: count('Подходы', 20), repsMin: duration, repsMax: duration })
  .refine(v => v.repsMin <= v.repsMax, { message: 'Диапазон времени: от меньшего к большему', path: ['repsMax'] })

// Минуты кардио: одно число, без диапазона; на бэк уходят секунды в обе границы
const minutes = z.string().transform((v, ctx) => {
  const seconds = parseTime('MINUTES', v)
  if (seconds === null || seconds < 60 || seconds > MEASURE_LIMITS.MINUTES.plan) {
    ctx.addIssue({ code: 'custom', message: 'Минуты — число от 1 до 240' })
    return z.NEVER
  }
  return seconds
})

// План кардио: «1 × 20 мин». Поле repsMax в форме не показывается — берётся из repsMin
export const complexExerciseMinutesSchema = z
  .object({ sets: count('Подходы', 20), repsMin: minutes, repsMax: z.string() })
  .transform(v => ({ sets: v.sets, repsMin: v.repsMin, repsMax: v.repsMin }))

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
