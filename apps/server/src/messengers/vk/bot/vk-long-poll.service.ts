import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';

import { VkApiClient } from '../api/vk-api.client';
import {
  VK_API_VERSION,
  VK_INTEGRATION_OPTIONS,
  VK_LOG_EMOJI,
  VK_LONG_POLL_RETRY_BASE_MS,
  VK_LONG_POLL_RETRY_MAX_MS,
  VK_LONG_POLL_WAIT_SECONDS,
} from '../vk.constants';
import { VkIntegrationOptions } from '../vk.types';

import { VkBotUpdate, VkUpdate } from './vk-bot.update';

interface LongPollServer {
  key: string;
  server: string;
  ts: string;
}

interface LongPollResponse {
  ts?: string;
  updates?: VkUpdate[];
  /** 1 — история устарела (берём новый ts), 2 — истёк key, 3 — потеряна информация (нужен новый сервер). */
  failed?: 1 | 2 | 3;
}

/**
 * Получение событий сообщества через Bots Long Poll API. Тот же принцип, что polling у Telegram:
 * не нужен публичный URL и Callback-сервер, работает и локально.
 *
 * Цикл запускаем сами при старте приложения, со своим логом и ретраем: сбой на старте (неверный
 * ключ, нет сети) не должен ронять приложение или молча останавливать бота навсегда.
 */
@Injectable()
export class VkLongPollService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(
    `${VK_LOG_EMOJI} ${VkLongPollService.name}`,
  );
  private readonly abort = new AbortController();

  constructor(
    @Inject(VK_INTEGRATION_OPTIONS)
    private readonly options: VkIntegrationOptions,
    private readonly api: VkApiClient,
    private readonly update: VkBotUpdate,
  ) {}

  public onApplicationBootstrap(): void {
    void this.run();
  }

  public onModuleDestroy(): void {
    this.abort.abort();
  }

  // ── Цикл ────────────────────────────────────────────────────────────────

  private async run(): Promise<void> {
    await this.configureEvents();
    let attempt = 0;
    let server: LongPollServer | null = null;

    while (!this.abort.signal.aborted) {
      try {
        if (!server) {
          server = await this.api.call<LongPollServer>(
            'groups.getLongPollServer',
            { group_id: this.options.groupId },
            this.abort.signal,
          );
          this.logger.log(
            `✅ Long Poll запущен, сообщество club${this.options.groupId}`,
          );
        }

        const response = await this.check(server);
        attempt = 0;

        if (response.failed === 1 && response.ts) {
          server.ts = response.ts;
          continue;
        }
        if (response.failed) {
          this.logger.warn(
            `Long Poll вернул failed=${response.failed} — запрашиваю новый сервер`,
          );
          server = null;
          continue;
        }

        if (response.ts) server.ts = response.ts;
        for (const update of response.updates ?? []) {
          // Каждое событие — отдельно: ошибка одного не должна терять остальные из пачки
          await this.update
            .handle(update)
            .catch((error) =>
              this.logger.error(
                `Необработанная ошибка в событии ${update.type}`,
                (error as Error).stack,
              ),
            );
        }
      } catch (error) {
        if (this.abort.signal.aborted) break;
        attempt += 1;
        server = null;
        const delayMs = Math.min(
          VK_LONG_POLL_RETRY_MAX_MS,
          VK_LONG_POLL_RETRY_BASE_MS * attempt,
        );
        this.logger.error(
          `❌ Long Poll упал (попытка ${attempt}), повтор через ${delayMs}мс: ${(error as Error).message}`,
        );
        await this.sleep(delayMs);
      }
    }
    this.logger.log('Long Poll остановлен');
  }

  private async check(server: LongPollServer): Promise<LongPollResponse> {
    const query = new URLSearchParams({
      act: 'a_check',
      key: server.key,
      ts: server.ts,
      wait: String(VK_LONG_POLL_WAIT_SECONDS),
    });
    const res = await fetch(`${server.server}?${query}`, {
      signal: this.abort.signal,
    });
    if (!res.ok) throw new Error(`Long Poll ответил HTTP ${res.status}`);
    return (await res.json()) as LongPollResponse;
  }

  /**
   * Включить в настройках сообщества Long Poll и нужные модулю события — иначе VK молча не присылает
   * нажатия кнопок и message_allow/deny. Нужно право «Управление сообществом» у ключа; без него
   * предупреждаем и работаем дальше — настройки можно включить руками в «Работа с API».
   */
  private async configureEvents(): Promise<void> {
    try {
      await this.api.call<number>('groups.setLongPollSettings', {
        group_id: this.options.groupId,
        enabled: 1,
        api_version: VK_API_VERSION,
        message_new: 1,
        message_event: 1,
        message_allow: 1,
        message_deny: 1,
      });
      this.logger.log(
        'Настройки Long Poll сообщества обновлены: message_new, message_event, message_allow, message_deny',
      );
    } catch (error) {
      this.logger.warn(
        `Не удалось включить события Long Poll (${(error as Error).message}) — проверьте их вручную в настройках сообщества → Работа с API → Long Poll API`,
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const onAbort = () => {
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => {
        this.abort.signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      this.abort.signal.addEventListener('abort', onAbort, { once: true });
    });
  }
}
