import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Bot, MaxError } from 'max-io';
import { InjectBot } from 'nestjs-max';

import { MaxDialogService } from '../dialog/max-dialog.service';
import {
  MAX_INTEGRATION_OPTIONS,
  MAX_LOG_EMOJI,
  MAX_POLLING_RETRY_BASE_MS,
  MAX_POLLING_RETRY_MAX_MS,
} from '../max.constants';
import { MaxIntegrationOptions } from '../max.types';

/** Тело inline-клавиатуры MAX: ряды кнопок. Тип кнопок — как в Bot API (callback/link/open_app/…). */
export type MaxKeyboardRow = Array<Record<string, unknown>>;

/** extra для отправки сообщения (attachments, format, notify…) — тип из max-io. */
export type MaxSendExtra = NonNullable<
  Parameters<Bot['api']['sendMessageToUser']>[2]
>;

/**
 * Отправка сообщений пользователям через бота и запуск самого бота.
 *
 * Использование снаружи модуля:
 *   - sendMessage(maxId, text, extra) — отправить и узнать об ошибке (бросает);
 *   - keyboard(rows) / openAppButton(text) — собрать клавиатуру для extra;
 *   - перед отправкой уведомлений проверять MaxDialogService.canDeliver(user).
 *
 * Если пользователь закрыл чат, MAX ответит dialog.not.found — сервис сам пометит чат закрытым,
 * чтобы следующие уведомления не долбили MAX впустую до нового открытия чата.
 */
@Injectable()
export class MaxBotService implements OnApplicationBootstrap {
  private readonly logger = new Logger(
    `${MAX_LOG_EMOJI} ${MaxBotService.name}`,
  );

  constructor(
    @InjectBot() private readonly bot: Bot,
    @Inject(MAX_INTEGRATION_OPTIONS)
    private readonly options: MaxIntegrationOptions,
    private readonly dialogService: MaxDialogService,
  ) {}

  /**
   * nestjs-max зарегистрирован с launchOptions: false (см. MaxIntegrationModule): его собственный
   * запуск вызывает bot.start() без await/catch, и сбой на старте (неверный токен, нет сети)
   * молча убивает polling навсегда. Запускаем сами — с логом и ретраем.
   */
  public onApplicationBootstrap(): void {
    this.startPolling();
  }

  // ── Отправка ────────────────────────────────────────────────────────────

  public async sendMessage(
    maxId: string | number,
    text: string,
    extra?: object,
  ) {
    try {
      const result = await this.bot.api.sendMessageToUser(
        Number(maxId),
        text,
        extra,
      );
      this.logger.debug(`Сообщение отправлено maxId=${maxId}`);
      return result;
    } catch (error) {
      const message =
        error instanceof MaxError
          ? `MAX[${error.code}]: ${error.message}`
          : String(error);
      this.logger.error(`Ошибка отправки сообщения maxId=${maxId}: ${message}`);
      if (message.includes('dialog.not.found')) {
        await this.dialogService.markClosed(maxId);
      }
      throw error instanceof MaxError ? new Error(message) : error;
    }
  }

  // ── Клавиатуры ──────────────────────────────────────────────────────────

  /** Обёртка inline-клавиатуры для extra.attachments. */
  public keyboard(rows: MaxKeyboardRow[]): MaxSendExtra {
    return {
      attachments: [{ type: 'inline_keyboard', payload: { buttons: rows } }],
    } as MaxSendExtra;
  }

  /** Кнопка, открывающая мини-приложение этого бота. */
  public openAppButton(
    text = '🚀 Открыть приложение',
  ): Record<string, unknown> {
    return { type: 'open_app', text, web_app: this.options.botName };
  }

  // ── Polling ─────────────────────────────────────────────────────────────

  private startPolling(attempt = 1): void {
    this.bot
      .start()
      .then(() => {
        // start() резолвится только на штатной остановке (bot.stop()), а не на успешном старте
        this.logger.log('Polling остановлен');
      })
      .catch((error) => {
        const delayMs = Math.min(
          MAX_POLLING_RETRY_MAX_MS,
          MAX_POLLING_RETRY_BASE_MS * attempt,
        );
        this.logger.error(
          `❌ Polling не запустился (попытка ${attempt}), повтор через ${delayMs}мс: ${
            error instanceof Error ? error.message : error
          }`,
        );
        // После throw библиотека оставляет pollingIsStarted=true — без stop() повторный start() ничего не сделает
        this.bot.stop();
        setTimeout(() => this.startPolling(attempt + 1), delayMs);
      });

    // Успешный запуск подтверждаем отдельным запросом — промис start() висит всё время работы
    this.bot.api
      .getMyInfo()
      .then((info) =>
        this.logger.log(`✅ Polling запущен, бот @${info.username}`),
      )
      .catch((error) => {
        this.logger.error(
          `getMyInfo не ответил (проверь токен бота): ${error instanceof Error ? error.message : error}`,
        );
      });
  }
}
