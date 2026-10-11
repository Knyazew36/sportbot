/**
 * Константы модуля VK. Всё, что фигурирует в ссылках и payload кнопок, собрано здесь — формат этих
 * строк живёт в чатах пользователей дольше, чем один деплой (старые сообщения с кнопками никто
 * не удаляет), поэтому менять их можно только с обратной совместимостью.
 */

/** DI-токен опций модуля (VkIntegrationModule.forRoot). */
export const VK_INTEGRATION_OPTIONS = Symbol('VK_INTEGRATION_OPTIONS');

/** DI-токен guard'а проекта, которым закрыты эндпоинты, требующие залогиненного пользователя. */
export const VK_HOST_AUTH_GUARD = Symbol('VK_HOST_AUTH_GUARD');

/** Эмодзи-префикс логгеров модуля — по нему логи VK фильтруются на сервере одним grep. */
export const VK_LOG_EMOJI = '🟦';

/** Версия VK API, под которую написаны запросы модуля. */
export const VK_API_VERSION = '5.199';

/**
 * Префиксы ref диплинка `https://vk.me/club<groupId>?ref=<payload>`. VK кладёт ref в первое
 * сообщение, которое пользователь отправит сообществу после перехода (обычно кнопка «Начать»).
 */
export const VK_REF_PAYLOAD = {
  /** Вход в веб-версию через VK (QR на странице логина). */
  login: 'login_',
  /** Привязка VK к уже залогиненному веб-аккаунту. */
  link: 'link_',
} as const;

/**
 * payload callback-кнопок, которые обрабатывает сам модуль. В VK payload кнопки — JSON до 255 байт;
 * модуль кладёт строку в поле `p` ({"p":"vk_login:confirm:<token>"}), чтобы кнопки VK вели себя так же,
 * как строковые callback_data у Telegram/MAX. Всё, что не начинается с этих значений, уходит
 * в VkAppAdapter.onCallback (например, кнопки опросов проекта).
 */
export const VK_CALLBACK = {
  loginConfirm: 'vk_login:confirm:',
  loginReject: 'vk_login:reject:',
  linkConfirm: 'vk_link:confirm:',
  linkReject: 'vk_link:reject:',
  notificationsCheck: 'vk:notifications:check',
} as const;

/**
 * Сколько секунд launch-параметры мини-приложения считаются свежими. Сутки: дольше держать сессию
 * без переоткрытия приложения незачем. Проект может переопределить через launchParamsTtlSeconds в forRoot.
 */
export const VK_LAUNCH_PARAMS_TTL_SECONDS = 24 * 60 * 60;

/** Время жизни одноразовых токенов входа и привязки. */
export const VK_LOGIN_TTL_MS = 5 * 60 * 1000;
export const VK_LINK_TTL_MS = 10 * 60 * 1000;

/** Сколько секунд Long Poll держит запрос открытым (максимум VK — 90). */
export const VK_LONG_POLL_WAIT_SECONDS = 25;

/** Пауза между попытками переподключения Long Poll при сбое (растёт линейно до максимума). */
export const VK_LONG_POLL_RETRY_BASE_MS = 5_000;
export const VK_LONG_POLL_RETRY_MAX_MS = 60_000;

/**
 * Коды ошибок messages.send, после которых бот не может писать пользователю, пока тот снова
 * не разрешит сообщения от сообщества: 901 — нет разрешения, 902 — настройки приватности,
 * 18 — страница удалена или заблокирована.
 */
export const VK_UNREACHABLE_ERROR_CODES = [18, 901, 902];
