import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Проверка подписи launch-параметров VK Mini App.
 *
 * Алгоритм VK:
 *  1. берём только параметры с префиксом `vk_`, сортируем по ключу;
 *  2. собираем query-строку `k=v&...` (значения url-энкодятся как encodeURIComponent);
 *  3. sign = base64url( HMAC_SHA256( строка, VK_APP_SECRET ) ) без `=`;
 *  4. сверяем со значением параметра `sign`.
 *
 * https://dev.vk.com/ru/mini-apps/development/launch-params-sign
 */
export interface VerifiedLaunchParams {
  vkUserId: number;
  vkAppId: number | null;
  /// id сообщества, из которого открыт мини-апп — отсутствует, если открыт не в контексте сообщества.
  vkGroupId: number | null;
  params: Record<string, string>;
}

export class LaunchParamsError extends Error {}

export function verifyVkLaunchParams(
  launchParams: string,
  secret: string,
  opts: { maxAgeSeconds?: number } = {},
): VerifiedLaunchParams {
  if (!secret) {
    throw new LaunchParamsError('VK_APP_SECRET не сконфигурирован');
  }

  const raw = launchParams.trim().replace(/^\?/, '');
  if (!raw) {
    throw new LaunchParamsError('Пустые launch-параметры');
  }

  const search = new URLSearchParams(raw);
  const sign = search.get('sign');
  if (!sign) {
    throw new LaunchParamsError('Отсутствует параметр sign');
  }

  const vkParams = [...search.entries()]
    .filter(([key]) => key.startsWith('vk_'))
    .sort(([a], [b]) => a.localeCompare(b));

  if (vkParams.length === 0) {
    throw new LaunchParamsError('Нет ни одного vk_-параметра');
  }

  const checkString = vkParams
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  const expected = createHmac('sha256', secret)
    .update(checkString)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const a = Buffer.from(expected);
  const b = Buffer.from(sign);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new LaunchParamsError('Неверная подпись launch-параметров');
  }

  const params = Object.fromEntries(vkParams);

  const maxAge = opts.maxAgeSeconds;
  if (maxAge && params.vk_ts) {
    const ts = Number(params.vk_ts);
    if (Number.isFinite(ts) && Math.floor(Date.now() / 1000) - ts > maxAge) {
      throw new LaunchParamsError('Launch-параметры устарели');
    }
  }

  const vkUserId = Number(params.vk_user_id);
  if (!Number.isInteger(vkUserId) || vkUserId <= 0) {
    throw new LaunchParamsError('Некорректный vk_user_id');
  }

  const vkAppId = Number(params.vk_app_id);
  const vkGroupId = Number(params.vk_group_id);

  return {
    vkUserId,
    vkAppId: Number.isInteger(vkAppId) ? vkAppId : null,
    vkGroupId: Number.isInteger(vkGroupId) && vkGroupId > 0 ? vkGroupId : null,
    params,
  };
}
