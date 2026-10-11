import { createHash, createHmac, timingSafeEqual } from 'crypto'

/**
 * Проверка подписи Telegram Login Widget.
 *
 * Алгоритм Telegram:
 *  1. все поля, кроме hash, сортируем по ключу;
 *  2. собираем data_check_string: `key=value`, по одной паре на строку, через `\n`;
 *  3. secret_key = SHA256(bot_token);
 *  4. hash = hex( HMAC_SHA256( data_check_string, secret_key ) );
 *  5. сверяем с присланным hash.
 *
 * https://core.telegram.org/widgets/login#checking-authorization
 */
export interface TelegramWidgetPayload {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export class TelegramWidgetAuthError extends Error {}

export function verifyTelegramWidgetAuth(
  payload: TelegramWidgetPayload,
  botToken: string,
  opts: { maxAgeSeconds?: number } = {},
): void {
  if (!botToken) {
    throw new TelegramWidgetAuthError('TG_BOT_TOKEN не сконфигурирован')
  }

  const { hash, ...fields } = payload
  if (!hash) {
    throw new TelegramWidgetAuthError('Отсутствует параметр hash')
  }

  const dataCheckString = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = createHash('sha256').update(botToken).digest()
  const expected = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  const a = Buffer.from(expected)
  const b = Buffer.from(hash)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new TelegramWidgetAuthError('Неверная подпись Telegram Login Widget')
  }

  const maxAge = opts.maxAgeSeconds
  if (maxAge && Math.floor(Date.now() / 1000) - payload.auth_date > maxAge) {
    throw new TelegramWidgetAuthError('Данные входа Telegram устарели')
  }
}
