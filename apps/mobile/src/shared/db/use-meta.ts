import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import type { LocalDb } from './client';
import type { MetaKey } from './meta';
import { meta } from './schema';

/** Значение из meta, обновляется вместе с базой (после каждого pull) */
export const useMetaValue = (db: LocalDb, key: MetaKey): string | undefined => {
  const { data } = useLiveQuery(db.select({ value: meta.value }).from(meta).where(eq(meta.key, key)), [key]);
  return data[0]?.value;
};
