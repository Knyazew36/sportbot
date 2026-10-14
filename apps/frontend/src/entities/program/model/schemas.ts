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
