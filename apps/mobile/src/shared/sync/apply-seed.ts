import type { SyncCatalogResponseDto } from '@sportbot/api/generated/model';

import type { LocalDb } from '@/shared/db/client';
import { META_KEYS, readMeta } from '@/shared/db/meta';
import { muscles } from '@/shared/db/schema';

import { applyCatalog } from './apply-catalog';

/**
 * Справочник из сборки — в пустую базу, до первого синка: экраны с упражнениями и мышцами
 * открываются без сети сразу. Снимок обновляют перед релизом (yarn content:mobile-seed на сервере)
 */
export const applySeedCatalog = (db: LocalDb) => {
  // Синк справочника уже был или снимок уже лёг — его данные свежее
  if (readMeta(db, META_KEYS.catalogCursor) || db.select({ id: muscles.id }).from(muscles).get()) return;
  // require, а не import: мегабайтный JSON разбирается только для новой базы, а не на каждом старте
  const seed = require('../../../assets/seed/catalog-seed.json') as SyncCatalogResponseDto;
  if (!seed.muscles.length) return;
  applyCatalog(db, seed, null);
  if (__DEV__) console.log(`[sync] снимок справочника: упражнений=${seed.exercises.length}, растяжек=${seed.stretches.length}`);
};
