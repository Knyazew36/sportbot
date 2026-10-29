import { errorCatch } from '@front-cmdt/utils/error-catch';

import { getAccessToken, getApiErrorStatus } from '@sportbot/api/client';
import { syncControllerCatalog, syncControllerPull, syncControllerPush } from '@sportbot/api/generated/sync/sync';

import type { LocalDb } from '@/shared/db/client';
import { META_KEYS, readMeta } from '@/shared/db/meta';
import { prefetchProgramMedia } from '@/shared/media/offline-media';

import { applyCatalog } from './apply-catalog';
import { applyPush, nextBatch } from './apply-push';
import { applyPull } from './apply-pull';
import { PUSH_DEBOUNCE_MS } from './constants';
import { refreshTokenIfOld } from './refresh-token';
import { setSyncStatus } from './sync-status';

/** push — только своё на сервер; full — ещё и серверное к себе */
type SyncMode = 'push' | 'full';

let running: Promise<void> | null = null;
let queued: SyncMode | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let activeDb: LocalDb | null = null;

/** База открытого аккаунта — её синкает requestSync. Ставит SyncRunner */
export const setActiveDb = (db: LocalDb | null) => {
  activeDb = db;
};

/**
 * Синк без доступа к базе в месте вызова: после REST-мутации экран из локальной базы
 * увидит правку, когда pull её привезёт. Базы ещё нет — нечего обновлять
 */
export const requestSync = () => {
  if (activeDb) void runSync(activeDb);
};

/**
 * Локальная правка легла в очередь — отправить, когда пользователь притихнет. Pull здесь не нужен:
 * на телефоне правка уже есть, а перечитывание экранов после каждого подхода и даёт тормоза онлайн
 */
export const requestPush = () => {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    if (activeDb) void schedule(activeDb, 'push');
  }, PUSH_DEBOUNCE_MS);
};

/** Приложение уходит в фон — отложенное отправить сразу: ОС может не дать дождаться таймера */
export const flushPush = () => {
  if (!pushTimer) return;
  clearTimeout(pushTimer);
  pushTimer = null;
  if (activeDb) void schedule(activeDb, 'push');
};

const pullOnce = async (db: LocalDb) => {
  const startedAt = new Date().toISOString();
  // Справочник и данные — независимые запросы: параллельно, применяются каждый своей транзакцией
  const [changes, catalog] = await Promise.allSettled([
    syncControllerPull({ since: readMeta(db, META_KEYS.cursor) }),
    syncControllerCatalog({ since: readMeta(db, META_KEYS.catalogCursor) }),
  ]);
  // Упавший один запрос не отменяет другой: без этого сбой pull оставлял телефон и без справочника
  if (catalog.status === 'fulfilled') applyCatalog(db, catalog.value);
  if (changes.status === 'fulfilled') applyPull(db, changes.value, startedAt);
  if (__DEV__) {
    const pull = changes.status === 'fulfilled' ? changes.value : null;
    console.log(
      `[sync] pull: ${pull ? `full=${pull.full}, тренировок=${pull.workouts.length}, подходов=${pull.workoutSets.length}, удалено=${pull.deleted.length}` : 'сбой'}, упражнений=${catalog.status === 'fulfilled' ? catalog.value.exercises.length : 'сбой'}`,
    );
  }
  for (const result of [changes, catalog]) if (result.status === 'rejected') throw result.reason;
};

/**
 * Очередь — пачками строго по порядку. Сбой сети или сервера (5xx) прерывает отправку целиком:
 * операции остаются в очереди, повтор вернёт уже применённые из журнала сервера по opId
 */
const pushAll = async (db: LocalDb): Promise<number> => {
  let rejectedTotal = 0;
  for (let batch = nextBatch(db); batch.length; batch = nextBatch(db)) {
    const { results } = await syncControllerPush({
      ops: batch.map((op) => ({ opId: op.opId, type: op.type, clientId: op.clientId, payload: op.payload, at: op.at })),
    });
    const rejected = applyPush(db, batch, results);
    rejectedTotal += rejected;
    if (__DEV__) console.log(`[sync] push: операций=${batch.length}, отклонено=${rejected}`);
    // Сервер ответил не на все: остальные уйдут следующим синком, а не бесконечным циклом здесь
    if (results.length < batch.length) break;
  }
  return rejectedTotal;
};

const runOnce = async (db: LocalDb, mode: SyncMode) => {
  if (!getAccessToken()) {
    setSyncStatus({ phase: 'signed-out' });
    return;
  }
  // Очередь уже ушла прошлым синком — сеть не трогаем
  if (mode === 'push' && !nextBatch(db).length) return;
  setSyncStatus({ phase: 'syncing' });
  try {
    // Сначала своё на сервер, потом серверное к себе: pull уже увидит отправленное.
    // Отказ сбросил курсор — без полного снимка телефон так и остался бы с отклонённой правкой
    const rejected = await pushAll(db);
    if (mode === 'push' && !rejected) {
      setSyncStatus({ phase: 'idle' });
      return;
    }
    await pullOnce(db);
    setSyncStatus({ phase: 'idle' });
    // Сеть есть прямо сейчас — самое время докачать картинки программы, пока не ушли в зал
    void prefetchProgramMedia(db);
    // Сбой продления не ошибка синка: старый токен ещё жив, попробуем в следующий раз
    void refreshTokenIfOld().catch((error: unknown) => {
      if (__DEV__) console.warn('[sync] токен не продлён', error);
    });
  } catch (error) {
    // Нет ответа — обычное дело в зале, данные на телефоне остаются; ответ с ошибкой — показать
    if (getApiErrorStatus(error) === undefined) setSyncStatus({ phase: 'offline' });
    else setSyncStatus({ phase: 'error', error: String(errorCatch(error) || 'Не удалось синхронизировать') });
    if (__DEV__) console.warn('[sync] не удалось', error);
  }
};

/**
 * Обмен с сервером. Вызовы во время идущего синка не теряются и не множатся:
 * после текущего пройдёт ещё один — он заберёт то, что поменялось за это время
 */
export const runSync = (db: LocalDb): Promise<void> => schedule(db, 'full');

/** Полный синк поглощает отложенный push: он и так начинается с отправки очереди */
const schedule = (db: LocalDb, mode: SyncMode): Promise<void> => {
  if (running) {
    queued = queued === 'full' || mode === 'full' ? 'full' : 'push';
    return running;
  }
  running = (async () => {
    let next: SyncMode | null = mode;
    while (next) {
      queued = null;
      await runOnce(db, next);
      next = queued;
    }
  })().finally(() => {
    running = null;
  });
  return running;
};
