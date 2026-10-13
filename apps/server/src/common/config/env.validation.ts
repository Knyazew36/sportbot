import { z } from 'zod';

// Валидация env при старте приложения. Неизвестные переменные разрешены (.loose()).
// Пустая строка в env трактуется как «не задано» для опциональных ключей.
const optionalString = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal('').transform(() => undefined));

const envSchema = z
  .object({
    // Безопасный дефолт: без явного development не включаются dev-послабления
    // (стек ошибки в ответе, коды подтверждения в логах, localhost в CORS)
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('production'),
    DATABASE_URL: z.string().min(1),
    // env всегда строка — coerce приводит к number.
    PORT: z.coerce.number().int().positive().default(4003),
    HTTP_CORS: optionalString,

    // --- auth ---
    JWT_SECRET: z
      .string()
      .min(16, 'JWT_SECRET должен быть не короче 16 символов'),
    JWT_EXPIRES_IN: z.string().trim().min(1).default('7d'),

    // --- почта (Resend) ---
    RESEND_API_KEY: z.string().min(1),
    MAIL_FROM: z.string().min(1),

    // --- ссылки ---
    FRONTEND_URL: optionalString,

    // --- бренд (тексты ботов, письма, уведомления) ---
    APP_NAME: z.string().trim().min(1).default('App'),
    SITE_URL: optionalString,
    APP_TIMEZONE: z
      .string()
      .trim()
      .min(1)
      .default('Europe/Moscow')
      .refine(
        (tz) => {
          try {
            new Intl.DateTimeFormat('en-US', { timeZone: tz });
            return true;
          } catch {
            return false;
          }
        },
        {
          message:
            'APP_TIMEZONE — неизвестный часовой пояс (нужен IANA, напр. Europe/Moscow)',
        },
      ),

    // --- загрузки ---
    UPLOAD_DIR: z.string().trim().min(1).default('uploads'),
    MAX_FILE_SIZE: z.coerce.number().int().positive().default(5242880),

    // --- платформенный админ (сид) ---
    // Пробелы, \r и неснятые кавычки вокруг значения — частая причина ложного «Invalid email»
    PLATFORM_ADMIN_EMAIL: z.preprocess(
      (value) =>
        typeof value === 'string'
          ? value.trim().replace(/^['"‘’“”]+|['"‘’“”]+$/g, '') || undefined
          : value,
      z.email().optional(),
    ),
    PLATFORM_ADMIN_PASSWORD: optionalString,

    // --- Мессенджеры (src/messengers). Не заданы — канал тихо не подключается,
    // см. messengers/app-messengers.ts. ---
    TG_BOT_TOKEN: optionalString,
    TG_BOT_NAME: optionalString,
    MAX_BOT_TOKEN: optionalString,
    MAX_BOT_NAME: optionalString,
    // --- спортбот: администратор по id в мессенджере (business-tz.md, раздел 30.1) ---
    // Ник (без «@») или числовой id — достаточно одного из способов
    ADMIN_TELEGRAM_USERNAME: optionalString,
    ADMIN_TELEGRAM_ID: optionalString,
    ADMIN_MAX_USERNAME: optionalString,
    ADMIN_MAX_ID: optionalString,
    VK_BOT_TOKEN: optionalString,
    VK_GROUP_ID: optionalString,
    // Нужны только мини-приложению VK (проверка подписи launch-параметров).
    VK_APP_ID: optionalString,
    VK_APP_SECRET: optionalString,
  })
  .loose();

export type Env = z.infer<typeof envSchema>;

// Передаётся в ConfigModule.forRoot({ validate }). Бросает при невалидном env — приложение не стартует.
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    throw new Error(
      `Config validation error:\n${z.prettifyError(parsed.error)}`,
    );
  }

  return parsed.data;
}
