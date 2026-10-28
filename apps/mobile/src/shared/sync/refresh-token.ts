import { getAccessToken, setAccessToken } from '@sportbot/api/client';
import { authControllerRefresh } from '@sportbot/api/generated/auth/auth';

import { TOKEN_REFRESH_AFTER_MS } from './constants';

/** Когда выдан токен (iat из JWT), мс. Не разобрался — null: продлим на всякий случай */
const issuedAt = (token: string): number | null => {
  try {
    const part = token.split('.')[1] ?? '';
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as { iat?: number };
    return typeof payload.iat === 'number' ? payload.iat * 1000 : null;
  } catch {
    return null;
  }
};

/**
 * Продлить сессию после удачного синка: токен живёт неделю, и без продления человек, который
 * тренируется офлайн и выходит в сеть раз в несколько дней, вылетал бы на вход. Раз в сутки, не чаще
 */
export const refreshTokenIfOld = async (): Promise<void> => {
  const token = getAccessToken();
  if (!token) return;
  const at = issuedAt(token);
  if (at !== null && Date.now() - at < TOKEN_REFRESH_AFTER_MS) return;
  const { accessToken } = await authControllerRefresh();
  // Пока ждали ответа, человек мог выйти — новый токен ему уже не нужен
  if (getAccessToken() === token) setAccessToken(accessToken, true, 'refresh');
  if (__DEV__) console.log('[sync] токен продлён');
};
