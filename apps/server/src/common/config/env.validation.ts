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
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
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
    APP_BASE_URL: optionalString,

    // --- платформенный админ (сид) ---
    PLATFORM_ADMIN_EMAIL: z
      .email()
      .optional()
      .or(z.literal('').transform(() => undefined)),

    // --- VK ---
    // VK_APP_SECRET используется и для проверки подписи launch-параметров VK Mini App,
    // и как client_secret при обмене authorization code в VK ID OAuth.
    VK_APP_ID: z.string().min(1),
    // ID приложения VK ID (вход на id.vk.ru) — отдельное от VK Mini App
    VK_ID_APP_ID: z.string().min(1),
    VK_APP_SECRET: z.string().min(1),
    // Должен 1-в-1 совпадать со значением, зарегистрированным в настройках VK ID приложения.
    VK_REDIRECT_URI: z.string().min(1),

    // Единое сообщество платформы (не по одному на кружок): VK_BOT_TOKEN — тот же
    // токен, что и у бота, с правом «Сообщения сообщества», шлёт messages.send всем
    // юзерам. VK_CALLBACK_SECRET/VK_CONFIRMATION_STRING — из настроек Callback API
    // этого сообщества, для /vk/callback. Опциональны: без них VK-интеграция
    // (бот + рассылки) просто не работает, остальное приложение не падает.
    VK_BOT_TOKEN: optionalString,
    VK_BOT_GROUP_ID: optionalString,
    VK_CALLBACK_SECRET: optionalString,
    VK_CONFIRMATION_STRING: optionalString,

    // --- Мессенджеры-боты (src/messengers). Не заданы — канал тихо не подключается,
    // см. messengers/app-messengers.ts. ---
    VK_GROUP_ID: optionalString,
    TG_BOT_TOKEN: optionalString,
    TG_BOT_NAME: optionalString,

    // --- MAX ---
    // Без токена бот не стартует, остальное приложение работает. MAX_NOTIFY_USER_ID —
    // maxId единственного получателя уведомлений о сообщениях из чата сайта.
    MAX_BOT_TOKEN: optionalString,
    MAX_NOTIFY_USER_ID: optionalString,
    MAX_BOT_NAME: optionalString,

    // --- рассылки / планировщик ---
    SCHEDULER_ENABLED: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'),
    SURVEY_DEFAULT_LEAD_HOURS: z.coerce.number().int().positive().default(18),
    REMINDER_DEFAULT_LEAD_HOURS: z.coerce.number().int().positive().default(3),
    MAX_MESSAGES_PER_DAY: z.coerce.number().int().positive().default(2),
    SESSION_HORIZON_DAYS: z.coerce.number().int().positive().default(60),
    ALERT_WEBHOOK_URL: optionalString,
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
