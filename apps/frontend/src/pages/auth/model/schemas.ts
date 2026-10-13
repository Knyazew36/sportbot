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
