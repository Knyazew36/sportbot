import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  VK_API_VERSION,
  VK_INTEGRATION_OPTIONS,
  VK_LOG_EMOJI,
} from '../vk.constants';
import { VkIntegrationOptions } from '../vk.types';

/** Ошибка, которую вернул сам VK API (поле error ответа). */
export class VkApiError extends Error {
  constructor(
    public readonly method: string,
    public readonly code: number,
    public readonly description: string,
  ) {
    super(`VK[${code}] ${method}: ${description}`);
  }
}

type VkApiParamValue = string | number | boolean | undefined | null;

interface VkApiResponse<T> {
  response?: T;
  error?: { error_code?: number; error_msg?: string };
}

/**
 * Тонкий клиент VK API на fetch с ключом сообщества. Без vk-io: модулю нужно с десяток методов,
 * а своя библиотека-обёртка тянула бы свой цикл запуска и типы, которые всё равно пришлось бы
 * переводить в контракт модуля.
 */
@Injectable()
export class VkApiClient {
  private readonly logger = new Logger(`${VK_LOG_EMOJI} ${VkApiClient.name}`);

  constructor(
    @Inject(VK_INTEGRATION_OPTIONS)
    private readonly options: VkIntegrationOptions,
  ) {}

  // ── Вызов метода ────────────────────────────────────────────────────────

  /** Вызвать метод VK API. Бросает VkApiError, если VK ответил ошибкой. */
  public async call<T>(
    method: string,
    params: Record<string, VkApiParamValue> = {},
    signal?: AbortSignal,
  ): Promise<T> {
    const body = new URLSearchParams({
      access_token: this.options.token,
      v: VK_API_VERSION,
    });
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) body.set(key, String(value));
    }

    const res = await fetch(`https://api.vk.com/method/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal,
    });
    const data = (await res.json().catch(() => ({}))) as VkApiResponse<T>;

    if (data.error || data.response === undefined) {
      const error = new VkApiError(
        method,
        data.error?.error_code ?? res.status,
        data.error?.error_msg ?? 'пустой ответ',
      );
      this.logger.debug(error.message);
      throw error;
    }
    return data.response;
  }
}
