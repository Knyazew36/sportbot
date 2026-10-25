import { z } from 'zod'

// Правила повторяют DTO сервера (apps/server/src/auth/dto): ошибка видна до отправки запроса
export const emailSchema = z.email('Некорректный email').max(254)

export const newPasswordSchema = z
  .string()
  .min(8, 'Пароль должен быть не короче 8 символов')
  // Предел bcrypt на сервере
  .max(72, 'Пароль должен быть не длиннее 72 символов')
  .regex(/\S/, 'Пароль не может состоять только из пробелов')

export const codeSchema = z.string().regex(/^\d{6}$/, 'Код должен состоять из 6 цифр')

export const CODE_LENGTH = 6

// ── Формы входа ──────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Введите пароль'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  name: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  email: emailSchema,
  password: newPasswordSchema,
})
export type RegisterValues = z.infer<typeof registerSchema>

export const verifyEmailSchema = z.object({ email: emailSchema, code: codeSchema })
export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>

export const forgotPasswordSchema = z.object({ email: emailSchema })
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({ email: emailSchema, code: codeSchema, newPassword: newPasswordSchema })
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

// ── Свой аккаунт ─────────────────────────────────────────────────────────────

// Пароль нужен, только если он задан (вход через бота пароля не даёт) — пустую строку не шлём
export const deleteAccountSchema = z.object({
  currentPassword: z
    .string()
    .max(72)
    .transform(value => value || undefined),
})
export type DeleteAccountInput = z.input<typeof deleteAccountSchema>
export type DeleteAccountValues = z.output<typeof deleteAccountSchema>
