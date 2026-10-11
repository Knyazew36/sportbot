import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Request } from 'express';

import { MessengerUser, MessengerUserStore } from '../../messenger.types';
import { MAX_INTEGRATION_OPTIONS, MAX_LOG_EMOJI } from '../max.constants';
import { MaxIntegrationOptions, MaxUserInfo } from '../max.types';

interface MaxInitDataParsed {
  auth_date: string;
  query_id?: string;
  start_param?: string;
  user: MaxUserInfo;
  hash: string;
}

const DEFAULT_INIT_DATA_TTL_SECONDS = 86400;
/** env-переменная модуля со сроком жизни initData — модуль читает её сам, проекту передавать не нужно. */
const INIT_DATA_TTL_ENV = 'MAX_AUTH_TTL_SECONDS';

/**
 * Авторизация запросов из мини-приложения MAX по initData.
 *
 * MAX открывает мини-приложение с подписанной строкой initData (window.WebApp.initData).
 * Фронт шлёт её в каждом запросе, сервер проверяет подпись токеном бота и по maxId находит
 * (или заводит) пользователя. Пароль и JWT в мини-приложении не нужны.
 *
 * Откуда берётся initData в запросе:
 * - заголовок `Authorization: max <initData>` — обычные запросы;
 * - query-параметр `initData` — когда заголовок поставить нельзя (WebApp.downloadFile/openLink
 *   открывают чистый https URL).
 *
 * Как подключить: добавить стратегию в общий guard проекта рядом с JWT-стратегией
 * (supports(req) → authenticate(req)). Интерфейс совпадает с AuthStrategy проекта по форме.
 */
@Injectable()
export class MaxAuthStrategy {
  public readonly provider = 'max' as const;
  private readonly logger = new Logger(
    `${MAX_LOG_EMOJI} ${MaxAuthStrategy.name}`,
  );
  private readonly ttlSeconds: number;

  constructor(
    @Inject(MAX_INTEGRATION_OPTIONS)
    private readonly options: MaxIntegrationOptions,
    private readonly users: MessengerUserStore,
  ) {
    this.ttlSeconds = options.initDataTtlSeconds ?? this.readTtlFromEnv();
  }

  // ── Стратегия авторизации ───────────────────────────────────────────────

  /** Есть ли в запросе initData — тогда этот запрос из мини-приложения и он наш. */
  public supports(req: Request): boolean {
    return this.extractInitDataRaw(req) !== null;
  }

  public async authenticate(req: Request): Promise<MessengerUser> {
    const initDataRaw = this.extractInitDataRaw(req);
    if (!initDataRaw) {
      throw new UnauthorizedException(
        'Нет initData: ожидается заголовок "max <initData>" или query-параметр initData',
      );
    }

    const maxUser = this.verifyAndParse(initDataRaw);
    const maxId = String(maxUser.id);

    return this.users.upsertByExternalId('MAX', maxId, {
      profile: maxUser as unknown as Record<string, unknown>,
    });
  }

  /**
   * Проверка подписи и свежести initData и разбор пользователя. Публичный, чтобы любой код
   * проекта, получивший initData не через заголовок (WebSocket, файлы), проверял его здесь же,
   * а не копировал HMAC-логику.
   */
  public verifyAndParse(initDataRaw: string): MaxUserInfo {
    try {
      this.validateSignature(initDataRaw);
    } catch (err) {
      this.logger.warn(
        `initData не прошёл проверку подписи: ${(err as Error).message}`,
      );
      throw new UnauthorizedException(
        `InitData validation failed: ${(err as Error).message}`,
      );
    }

    let initData: MaxInitDataParsed;
    try {
      initData = this.parse(initDataRaw);
    } catch (err) {
      this.logger.warn(`initData не разобран: ${(err as Error).message}`);
      throw new UnauthorizedException(
        `InitData parse failed: ${(err as Error).message}`,
      );
    }

    // auth_date входит в подпись, подделать его нельзя — значит, проверка свежести надёжна
    const authDate = Number(initData.auth_date);
    if (
      !Number.isFinite(authDate) ||
      Math.floor(Date.now() / 1000) - authDate > this.ttlSeconds
    ) {
      throw new UnauthorizedException('Init Data устарела');
    }

    return initData.user;
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /** Срок жизни initData из env; нет или мусор — сутки (с предупреждением, чтобы опечатку было видно). */
  private readTtlFromEnv(): number {
    const raw = process.env[INIT_DATA_TTL_ENV]?.trim();
    if (!raw) return DEFAULT_INIT_DATA_TTL_SECONDS;
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0) return value;
    this.logger.warn(
      `${INIT_DATA_TTL_ENV}="${raw}" — не положительное число, беру ${DEFAULT_INIT_DATA_TTL_SECONDS}`,
    );
    return DEFAULT_INIT_DATA_TTL_SECONDS;
  }

  private extractInitDataRaw(req: Request): string | null {
    const authHeader = String(req.header('authorization') || '');
    if (authHeader.startsWith('max ')) {
      return authHeader.slice('max '.length) || null;
    }

    const queryInitData = req.query?.initData;
    if (typeof queryInitData === 'string' && queryInitData.length > 0) {
      return queryInitData;
    }

    return null;
  }

  /**
   * Алгоритм MAX (документация мини-приложений dev.max.ru, раздел про валидацию initData):
   * 1) все пары key=value кроме hash, отсортированные, через \n — data_check_string;
   * 2) secret_key = HMAC_SHA256(key="WebAppData", message=<токен бота>);
   * 3) hash = hex(HMAC_SHA256(secret_key, data_check_string)).
   */
  private validateSignature(initDataRaw: string): void {
    const params = new URLSearchParams(initDataRaw);
    const hash = params.get('hash');
    if (!hash) {
      throw new Error('Missing hash in Init Data');
    }

    const dataCheckPairs: string[] = [];
    params.forEach((value, key) => {
      if (key !== 'hash') dataCheckPairs.push(`${key}=${value}`);
    });
    dataCheckPairs.sort();
    const dataCheckString = dataCheckPairs.join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(this.options.token)
      .digest();
    const computed = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest();
    const received = Buffer.from(hash, 'hex');

    // Сравнение за постоянное время — обычный !== позволяет подбирать подпись по времени ответа
    if (
      received.length !== computed.length ||
      !crypto.timingSafeEqual(received, computed)
    ) {
      throw new Error('Signature mismatch');
    }
  }

  private parse(initDataRaw: string): MaxInitDataParsed {
    const params = new URLSearchParams(initDataRaw);
    const auth_date = params.get('auth_date');
    const userStr = params.get('user');
    const hash = params.get('hash');

    if (!auth_date || !userStr || !hash) {
      throw new Error('Missing required fields in Init Data');
    }

    let user: MaxUserInfo;
    try {
      user = JSON.parse(userStr) as MaxUserInfo;
    } catch {
      throw new Error('Invalid user JSON in Init Data');
    }

    if (typeof user.id !== 'number') {
      throw new Error('Invalid user.id in Init Data');
    }

    return {
      auth_date,
      user,
      hash,
      query_id: params.get('query_id') ?? undefined,
      start_param: params.get('start_param') ?? undefined,
    };
  }
}
