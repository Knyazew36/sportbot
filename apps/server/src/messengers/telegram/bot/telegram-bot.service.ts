import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, TelegramError } from 'telegraf';
import type { InlineKeyboardButton } from 'telegraf/types';

import { TelegramDialogService } from '../dialog/telegram-dialog.service';
import {
  TELEGRAM_INTEGRATION_OPTIONS,
  TELEGRAM_LOG_EMOJI,
  TELEGRAM_POLLING_RETRY_BASE_MS,
  TELEGRAM_POLLING_RETRY_MAX_MS,
} from '../telegram.constants';
import {
  TelegramIntegrationOptions,
  TelegramStarsInvoice,
} from '../telegram.types';

/** Ряд inline-клавиатуры Telegram. */
export type TelegramKeyboardRow = InlineKeyboardButton[];

/** extra для отправки сообщения (reply_markup, parse_mode…) — тип из telegraf. */
export type TelegramSendExtra = NonNullable<
  Parameters<Telegraf['telegram']['sendMessage']>[2]
>;

/**
 * Ответы Telegram, после которых бот не может писать пользователю, пока тот снова не нажмёт «Start»:
 * заблокировал бота, удалил аккаунт или ни разу не открывал чат.
 */
const UNREACHABLE_DESCRIPTIONS = [
  'bot was blocked by the user',
  'user is deactivated',
  'chat not found',
];

/**
 * Отправка сообщений пользователям через бота и запуск самого бота.
 *
 * Использование снаружи модуля:
 *   - sendMessage(telegramId, text, extra) — отправить и узнать об ошибке (бросает);
 *   - keyboard(rows) / openAppButton(text) — собрать клавиатуру для extra;
 *   - перед отправкой уведомлений проверять TelegramDialogService.canDeliver(user).
 *
 * Если пользователь заблокировал бота, Telegram ответит 403 — сервис сам пометит чат закрытым,
 * чтобы следующие уведомления не долбили Telegram впустую до разблокировки.
 */
@Injectable()
export class TelegramBotService implements OnApplicationBootstrap {
  private readonly logger = new Logger(
    `${TELEGRAM_LOG_EMOJI} ${TelegramBotService.name}`,
  );

  constructor(
    @InjectBot() private readonly bot: Telegraf,
    @Inject(TELEGRAM_INTEGRATION_OPTIONS)
    private readonly options: TelegramIntegrationOptions,
    private readonly dialogService: TelegramDialogService,
  ) {}

  /**
   * nestjs-telegraf зарегистрирован с launchOptions: false (см. TelegramIntegrationModule): его
   * собственный запуск вызывает bot.launch() без await/catch, и сбой на старте (неверный токен,
   * нет сети) молча убивает polling навсегда. Запускаем сами — с логом и ретраем.
   */
  public onApplicationBootstrap(): void {
    // По умолчанию telegraf пробрасывает ошибку обработчика наружу, и она роняет весь polling
    this.bot.catch((error, ctx) => {
      this.logger.error(
        `Необработанная ошибка в апдейте ${ctx.updateType}, telegramId=${ctx.from?.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    });
    this.startPolling();
  }

  // ── Отправка ────────────────────────────────────────────────────────────

  public async sendMessage(
    telegramId: string | number,
    text: string,
    extra?: TelegramSendExtra,
  ) {
    try {
      const result = await this.bot.telegram.sendMessage(
        Number(telegramId),
        text,
        extra,
      );
      this.logger.debug(`Сообщение отправлено telegramId=${telegramId}`);
      return result;
    } catch (error) {
      throw await this.sendFailed(telegramId, 'сообщения', error);
    }
  }

  /**
   * Отправить картинку с подписью. photo — file_id уже загруженного файла или путь к файлу.
   * Подпись Telegram — до 1024 символов: длинный текст уходит отдельным сообщением следом.
   * @returns file_id картинки — для повторной отправки без загрузки.
   */
  public async sendPhoto(
    telegramId: string | number,
    photo: { fileId?: string; path: string },
    text: string,
    extra?: TelegramSendExtra,
  ): Promise<string | undefined> {
    const fits = text.length <= 1024;
    try {
      const result = await this.bot.telegram.sendPhoto(
        Number(telegramId),
        photo.fileId ?? { source: photo.path },
        fits
          ? {
              caption: text,
              caption_entities: extra?.entities,
              reply_markup: extra?.reply_markup as never,
            }
          : undefined,
      );
      if (!fits) await this.sendMessage(telegramId, text, extra);
      this.logger.debug(`Картинка отправлена telegramId=${telegramId}`);
      return result.photo.at(-1)?.file_id;
    } catch (error) {
      throw await this.sendFailed(telegramId, 'картинки', error);
    }
  }

  /**
   * Отправить файл документом: Telegram не пережимает его, в отличие от sendVideo/sendPhoto
   * (видео с прозрачностью после пережатия теряет альфу). Лимит Bot API — 50 МБ.
   */
  public async sendDocument(
    telegramId: string | number,
    file: { path: string; name: string },
    text: string,
    extra?: TelegramSendExtra,
  ): Promise<void> {
    const fits = text.length <= 1024;
    try {
      await this.bot.telegram.sendDocument(
        Number(telegramId),
        { source: file.path, filename: file.name },
        fits
          ? {
              caption: text,
              caption_entities: extra?.entities,
              reply_markup: extra?.reply_markup as never,
            }
          : undefined,
      );
      if (!fits) await this.sendMessage(telegramId, text, extra);
      this.logger.debug(`Файл отправлен telegramId=${telegramId}`);
    } catch (error) {
      throw await this.sendFailed(telegramId, 'файла', error);
    }
  }

  /**
   * Лог отказа и ошибка с понятным текстом. Если Telegram ответил, что писать пользователю нельзя, —
   * чат помечается закрытым, чтобы следующие отправки не долбили Telegram впустую.
   */
  private async sendFailed(
    telegramId: string | number,
    what: string,
    error: unknown,
  ): Promise<unknown> {
    const message =
      error instanceof TelegramError
        ? `Telegram[${error.code}]: ${error.description}`
        : String(error);
    this.logger.error(
      `Ошибка отправки ${what} telegramId=${telegramId}: ${message}`,
    );
    if (
      error instanceof TelegramError &&
      UNREACHABLE_DESCRIPTIONS.some((d) => error.description.includes(d))
    ) {
      await this.dialogService.markClosed(telegramId);
    }
    return error instanceof TelegramError ? new Error(message) : error;
  }

  /** Меню команд бота (кнопка «/» в клиенте). */
  public async setCommands(
    commands: { name: string; description: string }[],
  ): Promise<void> {
    await this.bot.telegram.setMyCommands(
      commands.map((c) => ({ command: c.name, description: c.description })),
    );
    this.logger.log(`Меню команд обновлено: ${commands.length}`);
  }

  /** Ссылка на скачивание файла, присланного боту. */
  public async getFileUrl(fileId: string): Promise<string> {
    return (await this.bot.telegram.getFileLink(fileId)).toString();
  }

  /**
   * Ссылка на текущее фото профиля пользователя (jpeg) или null, если фото нет или оно скрыто
   * настройками приватности. photo_url из initData не подходит: Telegram отдаёт там svg-обёртку.
   */
  public async getProfilePhotoUrl(
    telegramId: string | number,
  ): Promise<string | null> {
    const { photos } = await this.bot.telegram.getUserProfilePhotos(
      Number(telegramId),
      0,
      1,
    );
    // Размеры идут по возрастанию: берём наибольший не крупнее 640px — аватару больше не нужно
    const sizes = photos[0] ?? [];
    const size = sizes.filter((s) => s.width <= 640).at(-1) ?? sizes[0];
    if (!size) {
      this.logger.debug(`Фото профиля нет: telegramId=${telegramId}`);
      return null;
    }
    return this.getFileUrl(size.file_id);
  }

  // ── Оплата звёздами ─────────────────────────────────────────────────────

  /**
   * Ссылка на счёт в звёздах для WebApp.openInvoice. Для XTR provider_token пустой,
   * цена — одна позиция: Telegram не даёт делить счёт в звёздах на несколько строк.
   */
  public async createStarsInvoiceLink(
    invoice: TelegramStarsInvoice,
  ): Promise<string> {
    try {
      const url = await this.bot.telegram.createInvoiceLink({
        title: invoice.title,
        description: invoice.description,
        payload: invoice.payload,
        provider_token: '',
        currency: 'XTR',
        prices: [{ label: invoice.title, amount: invoice.amount }],
      });
      this.logger.log(
        `Счёт в звёздах выставлен: payload=${invoice.payload}, amount=${invoice.amount}`,
      );
      return url;
    } catch (error) {
      const message = this.describeError(error);
      this.logger.error(
        `Счёт в звёздах не выставлен: payload=${invoice.payload}: ${message}`,
      );
      throw new Error(message);
    }
  }

  /** Вернуть звёзды пользователю. В telegraf 4.16 обёртки нет — вызываем метод Bot API напрямую. */
  public async refundStarPayment(
    telegramId: string | number,
    chargeId: string,
  ): Promise<void> {
    try {
      await this.bot.telegram.callApi(
        'refundStarPayment' as never,
        {
          user_id: Number(telegramId),
          telegram_payment_charge_id: chargeId,
        } as never,
      );
      this.logger.log(
        `Звёзды возвращены: telegramId=${telegramId}, chargeId=${chargeId}`,
      );
    } catch (error) {
      const message = this.describeError(error);
      this.logger.error(
        `Возврат звёзд не прошёл: telegramId=${telegramId}, chargeId=${chargeId}: ${message}`,
      );
      throw new Error(message);
    }
  }

  // ── Клавиатуры ──────────────────────────────────────────────────────────

  /** Обёртка inline-клавиатуры для extra. */
  public keyboard(rows: TelegramKeyboardRow[]): TelegramSendExtra {
    return { reply_markup: { inline_keyboard: rows } };
  }

  /**
   * Кнопка, открывающая мини-приложение. web_app-кнопка открывает его прямо поверх чата;
   * без webAppUrl — ссылка ?startapp на Main Mini App бота.
   */
  public openAppButton(
    text = '🚀 Открыть приложение',
    startParam?: string,
  ): InlineKeyboardButton {
    // Кнопка web_app не передаёт start_param в initData — экран едет в адресе приложения
    const query = startParam
      ? `startapp=${encodeURIComponent(startParam)}`
      : '';
    if (this.options.webAppUrl) {
      const url = new URL(this.options.webAppUrl);
      if (startParam) url.searchParams.set('startapp', startParam);
      return { text, web_app: { url: url.toString() } };
    }
    return {
      text,
      url: `https://t.me/${this.options.botName}?${query || 'startapp'}`,
    };
  }

  // ── Polling ─────────────────────────────────────────────────────────────

  private startPolling(attempt = 1): void {
    this.bot
      .launch(() =>
        this.logger.log(
          `✅ Polling запущен, бот @${this.bot.botInfo?.username}`,
        ),
      )
      .then(() => {
        // launch() резолвится только на штатной остановке (bot.stop()), а не на успешном старте
        this.logger.log('Polling остановлен');
      })
      .catch((error) => {
        const delayMs = Math.min(
          TELEGRAM_POLLING_RETRY_MAX_MS,
          TELEGRAM_POLLING_RETRY_BASE_MS * attempt,
        );
        this.logger.error(
          `❌ Polling не запустился (попытка ${attempt}), повтор через ${delayMs}мс: ${
            error instanceof Error ? error.message : error
          }`,
        );
        try {
          this.bot.stop('retry');
        } catch {
          // Падение до старта polling (getMe/deleteWebhook) — останавливать нечего
        }
        setTimeout(() => this.startPolling(attempt + 1), delayMs);
      });
  }

  // ── Вспомогательное ─────────────────────────────────────────────────────

  private describeError(error: unknown): string {
    return error instanceof TelegramError
      ? `Telegram[${error.code}]: ${error.description}`
      : String(error);
  }
}
