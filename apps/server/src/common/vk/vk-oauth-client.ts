import { UnauthorizedException } from '@nestjs/common';

// VK ID (OAuth 2.1 + PKCE, публичный клиент — без client_secret).
// Домен и точная форма запросов сверены с исходником @vkid/sdk (dist-sdk/cjs/auth/auth.js):
// параметры авторизации идут в query, `code`/`access_token` — в теле POST.
const VK_ID_DOMAIN = 'id.vk.ru';

export interface VkOAuthTokenParams {
  code: string;
  codeVerifier: string;
  deviceId: string;
  redirectUri: string;
  state: string;
  clientId: string;
}

export interface VkOAuthTokenResult {
  accessToken: string;
  vkUserId: string;
}

export interface VkOAuthUserInfo {
  vkUserId: string;
  raw: Record<string, unknown>;
}

async function parseOAuthSectionResponse(
  res: Response,
  fallbackMessage: string,
): Promise<Record<string, unknown>> {
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if ('error' in data) {
    throw new UnauthorizedException(
      typeof data.error_description === 'string' ? data.error_description : fallbackMessage,
    );
  }

  return data;
}

/** Обменивает authorization code VK ID на access_token (PKCE, без client_secret). */
export async function exchangeVkOAuthCode(
  params: VkOAuthTokenParams,
): Promise<VkOAuthTokenResult> {
  const query = new URLSearchParams({
    grant_type: 'authorization_code',
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    code_verifier: params.codeVerifier,
    state: params.state,
    device_id: params.deviceId,
  });

  const res = await fetch(`https://${VK_ID_DOMAIN}/oauth2/auth?${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code: params.code }),
  });

  const data = await parseOAuthSectionResponse(res, 'Не удалось обменять код VK ID на токен');

  if (!data.access_token || !data.user_id) {
    throw new UnauthorizedException('Не удалось обменять код VK ID на токен');
  }

  return {
    accessToken: String(data.access_token),
    vkUserId: String(data.user_id),
  };
}

/** Забирает профиль пользователя VK ID по access_token. */
export async function fetchVkOAuthUserInfo(
  accessToken: string,
  clientId: string,
): Promise<VkOAuthUserInfo> {
  const query = new URLSearchParams({ client_id: clientId });

  const res = await fetch(`https://${VK_ID_DOMAIN}/oauth2/user_info?${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ access_token: accessToken }),
  });

  const data = await parseOAuthSectionResponse(res, 'Не удалось получить профиль VK ID');
  const user = (data.user ?? data) as Record<string, unknown>;
  const vkUserId = user.user_id;

  if (vkUserId == null) {
    throw new UnauthorizedException('Не удалось получить профиль VK ID');
  }

  return { vkUserId: String(vkUserId), raw: user };
}
