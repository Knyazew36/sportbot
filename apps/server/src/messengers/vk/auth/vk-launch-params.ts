import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Проверка подписи launch-параметров VK Mini App — чистые функции без Nest.
 *
 * Алгоритм VK (https://dev.vk.com/ru/mini-apps/development/launch-params-sign):
 *  1. берём только параметры с префиксом `vk_`, сортируем по ключу;
 *  2. собираем query-строку `k=v&...` (значения через encodeURIComponent);
 *  3. sign = base64url(HMAC_SHA256(строка, защищённый ключ приложения)) без `=`;
 *  4. сверяем со значением параметра `sign`.
 */
export interface VerifiedLaunchParams {
  vkId: number;
  /** Все vk_*-параметры: vk_app_id, vk_platform, vk_language и т.п. */
  params: Record<string, string>;
}

export class VkLaunchParamsError extends Error {}

export function verifyVkLaunchParams(
  launchParams: string,
  secret: string,
  opts: { maxAgeSeconds?: number } = {},
): VerifiedLaunchParams {
  const raw = launchParams.trim().replace(/^\?/, '');
  if (!raw) throw new VkLaunchParamsError('Пустые launch-параметры');

  const search = new URLSearchParams(raw);
  const sign = search.get('sign');
  if (!sign) throw new VkLaunchParamsError('Отсутствует параметр sign');

  const vkParams = [...search.entries()]
    .filter(([key]) => key.startsWith('vk_'))
    .sort(([a], [b]) => a.localeCompare(b));
  if (vkParams.length === 0)
    throw new VkLaunchParamsError('Нет ни одного vk_-параметра');

  const checkString = vkParams
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  const expected = createHmac('sha256', secret)
    .update(checkString)
    .digest('base64url')
    .replace(/=+$/, '');

  const a = Buffer.from(expected);
  const b = Buffer.from(sign);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new VkLaunchParamsError('Неверная подпись launch-параметров');
  }

  const params = Object.fromEntries(vkParams);

  if (opts.maxAgeSeconds && params.vk_ts) {
    const ts = Number(params.vk_ts);
    if (
      Number.isFinite(ts) &&
      Math.floor(Date.now() / 1000) - ts > opts.maxAgeSeconds
    ) {
      throw new VkLaunchParamsError('Launch-параметры устарели');
    }
  }

  const vkId = Number(params.vk_user_id);
  if (!Number.isInteger(vkId) || vkId <= 0)
    throw new VkLaunchParamsError('Некорректный vk_user_id');

  return { vkId, params };
}
