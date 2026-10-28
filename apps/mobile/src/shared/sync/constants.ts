/** Фоновый синк, пока приложение на экране */
export const SYNC_INTERVAL_MS = 5 * 60_000;

/** Операций в одном POST sync/push — столько принимает сервер (SYNC_PUSH_LIMIT) */
export const PUSH_BATCH = 50;

/** Сколько последних отказов сервера помнить для плашки */
export const SYNC_ISSUES_KEEP = 20;

/** Сколько ждать, собирая события изменения базы в одно перечитывание экранов */
export const LOCAL_REFRESH_MS = 80;

/** Картинок справочника за один prefetch: прогресс виден, а сеть не забита сотней запросов разом */
export const MEDIA_CHUNK = 8;

/** Токену столько от выдачи — после синка просим новый (сам токен живёт 7 дней) */
export const TOKEN_REFRESH_AFTER_MS = 24 * 60 * 60_000;
