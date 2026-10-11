import { z } from 'zod'

// Схема env: опечатка или пропуск переменной роняет приложение при старте с понятным текстом, а не в рантайме запроса
const envSchema = z.object({
  VITE_API_URL_PROD: z.url().optional(),
  // Статичные макеты без API: гарды пропускают всех, данные берутся из моков
  VITE_DEMO: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  throw new Error(`Некорректные переменные окружения:\n${z.prettifyError(parsed.error)}`)
}

export const env = {
  VITE_API_URL_PROD: parsed.data.VITE_API_URL_PROD ?? '',
  DEMO: parsed.data.VITE_DEMO,
}
