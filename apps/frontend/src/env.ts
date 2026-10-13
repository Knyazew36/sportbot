import { z } from 'zod'

// Схема env: опечатка или пропуск переменной роняет приложение при старте с понятным текстом, а не в рантайме запроса
const envSchema = z.object({
  VITE_API_URL: z.url(),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  throw new Error(`Некорректные переменные окружения:\n${z.prettifyError(parsed.error)}`)
}

export const env = {
  // Без хвостового слэша: пути запросов начинаются с «/»
  API_URL: parsed.data.VITE_API_URL.replace(/\/+$/, ''),
}
