/**
 * Константы модуля Telegram. Всё, что фигурирует в ссылках и callback_data кнопок, собрано здесь —
 * формат этих строк живёт в чатах пользователей дольше, чем один деплой (старые сообщения
 * с кнопками никто не удаляет), поэтому менять их можно только с обратной совместимостью.
 */

/** DI-токен опций модуля (TelegramIntegrationModule.forRoot). */
export const TELEGRAM_INTEGRATION_OPTIONS = Symbol(
  'TELEGRAM_INTEGRATION_OPTIONS',
);

/** DI-токен guard'а проекта, которым закрыты эндпоинты, требующие залогиненного пользователя. */
export const TELEGRAM_HOST_AUTH_GUARD = Symbol('TELEGRAM_HOST_AUTH_GUARD');

/** Эмодзи-префикс логгеров модуля — по нему логи Telegram фильтруются на сервере одним grep. */
export const TELEGRAM_LOG_EMOJI = '✈️';

/**
 * Префиксы payload диплинка `https://t.me/<bot>?start=<payload>`. Telegram передаёт payload
 * боту как аргумент команды /start. Лимит — 64 символа из [A-Za-z0-9_-], иначе Telegram
 * откроет чат без payload.
 */
export const TELEGRAM_START_PAYLOAD = {
  /** Вход в веб-версию через Telegram (QR на странице логина). */
  login: 'login_',
  /** Привязка Telegram к уже залогиненному веб-аккаунту. */
  link: 'link_',
} as const;

/**
 * callback_data кнопок, которые обрабатывает сам модуль (лимит Telegram — 64 байта).
 * Всё, что не начинается с этих значений, уходит в TelegramAppAdapter.onCallback
 * (например, кнопки опросов проекта).
 */
export const TELEGRAM_CALLBACK = {
  loginConfirm: 'tg_login:confirm:',
  loginReject: 'tg_login:reject:',
  linkConfirm: 'tg_link:confirm:',
  linkReject: 'tg_link:reject:',
  notificationsCheck: 'tg:notifications:check',
} as const;

/**
 * Сколько секунд initData мини-приложения считается свежим. Сутки: дольше держать сессию без
 * переоткрытия приложения незачем. Проект может переопределить через initDataTtlSeconds в forRoot.
 */
export const TELEGRAM_INIT_DATA_TTL_SECONDS = 24 * 60 * 60;

/** Время жизни одноразовых токенов входа и привязки. */
export const TELEGRAM_LOGIN_TTL_MS = 5 * 60 * 1000;
export const TELEGRAM_LINK_TTL_MS = 10 * 60 * 1000;

/** Пауза между попытками запуска polling при сбое (растёт линейно до максимума). */
export const TELEGRAM_POLLING_RETRY_BASE_MS = 5_000;
export const TELEGRAM_POLLING_RETRY_MAX_MS = 60_000;
