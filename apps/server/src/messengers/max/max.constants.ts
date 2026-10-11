/**
 * Константы модуля MAX. Всё, что фигурирует в ссылках и payload кнопок, собрано здесь —
 * формат этих строк живёт в чатах пользователей дольше, чем один деплой (старые сообщения
 * с кнопками никто не удаляет), поэтому менять их можно только с обратной совместимостью.
 */

/** DI-токен опций модуля (MaxIntegrationModule.forRoot). */
export const MAX_INTEGRATION_OPTIONS = Symbol('MAX_INTEGRATION_OPTIONS');

/** DI-токен guard'а проекта, которым закрыты эндпоинты, требующие залогиненного пользователя. */
export const MAX_HOST_AUTH_GUARD = Symbol('MAX_HOST_AUTH_GUARD');

/** Эмодзи-префикс логгеров модуля — по нему логи MAX фильтруются на сервере одним grep. */
export const MAX_LOG_EMOJI = '🤖';

/**
 * Префиксы payload диплинка `https://max.ru/<bot>?start=<payload>`. MAX передаёт payload
 * боту в событии bot_started, лимит — 128 символов (иначе payload молча теряется).
 */
export const MAX_START_PAYLOAD = {
  /** Вход в веб-версию через MAX (QR на странице логина). */
  login: 'login_',
  /** Привязка MAX к уже залогиненному веб-аккаунту. */
  link: 'link_',
} as const;

/**
 * Payload callback-кнопок, которые обрабатывает сам модуль. Всё, что не начинается с этих
 * значений, уходит в MaxAppAdapter.onCallback (например, кнопки опросов проекта).
 */
export const MAX_CALLBACK = {
  loginConfirm: 'max_login:confirm:',
  loginReject: 'max_login:reject:',
  linkConfirm: 'max_link:confirm:',
  linkReject: 'max_link:reject:',
  notificationsCheck: 'max:notifications:check',
  /** Старый payload кнопки «Проверить уведомления» — остался в уже отправленных приветствиях. */
  notificationsCheckLegacy: 'notifications:check',
} as const;

/** Время жизни одноразовых токенов входа и привязки. */
export const MAX_LOGIN_TTL_MS = 5 * 60 * 1000;
export const MAX_LINK_TTL_MS = 10 * 60 * 1000;

/** Пауза между попытками запуска polling при сбое (растёт линейно до максимума). */
export const MAX_POLLING_RETRY_BASE_MS = 5_000;
export const MAX_POLLING_RETRY_MAX_MS = 60_000;
