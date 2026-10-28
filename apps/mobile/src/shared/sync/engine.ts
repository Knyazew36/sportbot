import { errorCatch } from '@front-cmdt/utils/error-catch';

import { getAccessToken, getApiErrorStatus } from '@sportbot/api/client';
import { syncControllerCatalog, syncControllerPull, syncControllerPush } from '@sportbot/api/generated/sync/sync';

import type { LocalDb } from '@/shared/db/client';
import { META_KEYS, readMeta } from '@/shared/db/meta';
import { prefetchProgramMedia } from '@/shared/media/offline-media';

import { applyCatalog } from './apply-catalog';
import { applyPush, nextBatch } from './apply-push';
import { applyPull } from './apply-pull';
import { refreshTokenIfOld } from './refresh-token';
import { setSyncStatus } from './sync-status';

let running: Promise<void> | null = null;
let again = false;
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

const pullOnce = async (db: LocalDb) => {
  const startedAt = new Date().toISOString();
  // Справочник и данные — независимые запросы: параллельно, применяются каждый своей транзакцией
  const [changes, catalog] = await Promise.all([
    syncControllerPull({ since: readMeta(db, META_KEYS.cursor) }),
    syncControllerCatalog({ since: readMeta(db, META_KEYS.catalogCursor) }),
  ]);
  applyCatalog(db, catalog);
  applyPull(db, changes, startedAt);
  if (__DEV__) {
    console.log(
      `[sync] pull: full=${changes.full}, тренировок=${changes.workouts.length}, подходов=${changes.workoutSets.length}, удалено=${changes.deleted.length}, упражнений=${catalog.exercises.length}`,
    );
  }
};

/**
 * Очередь — пачками строго по порядку. Сбой сети или сервера (5xx) прерывает отправку целиком:
 * операции остаются в очереди, повтор вернёт уже применённые из журнала сервера по opId
 */
const pushAll = async (db: LocalDb) => {
  for (let batch = nextBatch(db); batch.length; batch = nextBatch(db)) {
    const { results } = await syncControllerPush({
      ops: batch.map((op) => ({ opId: op.opId, type: op.type, clientId: op.clientId, payload: op.payload, at: op.at })),
    });
    const rejected = applyPush(db, batch, results);
    if (__DEV__) console.log(`[sync] push: операций=${batch.length}, отклонено=${rejected}`);
    // Сервер ответил не на все: остальные уйдут следующим синком, а не бесконечным циклом здесь
    if (results.length < batch.length) break;
  }
};

const runOnce = async (db: LocalDb) => {
  if (!getAccessToken()) {
    setSyncStatus({ phase: 'signed-out' });
    return;
  }
  setSyncStatus({ phase: 'syncing' });
  try {
    // Сначала своё на сервер, потом серверное к себе: pull уже увидит отправленное
    await pushAll(db);
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
export const runSync = (db: LocalDb): Promise<void> => {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      await runOnce(db);
    } while (again);
  })().finally(() => {
    running = null;
  });
  return running;
};
