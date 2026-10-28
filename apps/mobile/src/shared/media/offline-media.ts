import { eq, inArray } from 'drizzle-orm';
import { Image } from 'expo-image';

import type { LocalDb } from '@/shared/db/client';
import { META_KEYS, readMeta, writeMeta } from '@/shared/db/meta';
import { complexes, complexExercises, exercises, profile, stretches } from '@/shared/db/schema';
import { MEDIA_CHUNK } from '@/shared/sync/constants';

export type MediaProgress = { done: number; total: number };

type ImagePair = { a: string | null; b: string | null };

const uniqueUrls = (rows: ImagePair[]) =>
  [...new Set(rows.flatMap((r) => [r.a, r.b]).filter((url): url is string => !!url))];

/** Все картинки справочника из локальной базы: начало и конец движения */
export const catalogImageUrls = (db: LocalDb): string[] =>
  uniqueUrls([
    ...db.select({ a: exercises.imageUrl, b: exercises.imageEndUrl }).from(exercises).all(),
    ...db.select({ a: stretches.imageUrl, b: stretches.imageEndUrl }).from(stretches).all(),
  ]);

/**
 * Картинки, без которых не пройти тренировку активной программы: её упражнения и растяжки
 * на те же мышцы — из них собирается заминка
 */
export const programImageUrls = (db: LocalDb): string[] => {
  const programClientId = db.select({ id: profile.activeProgramClientId }).from(profile).get()?.id;
  if (!programClientId) return [];
  const ids = db
    .selectDistinct({ id: complexExercises.exerciseId })
    .from(complexExercises)
    .innerJoin(complexes, eq(complexes.clientId, complexExercises.complexClientId))
    .where(eq(complexes.programClientId, programClientId))
    .all()
    .map((r) => r.id);
  if (!ids.length) return [];
  const rows = db
    .select({ a: exercises.imageUrl, b: exercises.imageEndUrl, muscles: exercises.muscles })
    .from(exercises)
    .where(inArray(exercises.id, ids))
    .all();
  const muscleIds = new Set(rows.flatMap((r) => r.muscles.map((m) => m.muscleId)));
  const stretchRows = db
    .select({ a: stretches.imageUrl, b: stretches.imageEndUrl, muscleIds: stretches.muscleIds })
    .from(stretches)
    .all()
    .filter((r) => r.muscleIds.some((id) => muscleIds.has(id)));
  return uniqueUrls([...rows, ...stretchRows]);
};

let programPrefetch: Promise<void> | null = null;

/**
 * Молча докачать картинки активной программы — зовётся после каждого обмена с сервером.
 * Набор не поменялся с прошлой удачной докачки — сеть не трогаем; не докачалось — повторим в следующий раз
 */
export const prefetchProgramMedia = (db: LocalDb): Promise<void> => {
  if (programPrefetch) return programPrefetch;
  programPrefetch = (async () => {
    const urls = programImageUrls(db);
    const key = urls.join(' ');
    if (!urls.length || readMeta(db, META_KEYS.programMedia) === key) return;
    let ok = true;
    for (let i = 0; i < urls.length; i += MEDIA_CHUNK) {
      ok &&= await Image.prefetch(urls.slice(i, i + MEDIA_CHUNK), 'disk').catch(() => false);
    }
    if (ok) writeMeta(db, META_KEYS.programMedia, key);
    if (__DEV__) console.log(`[media] программа: картинок=${urls.length}, ok=${ok}`);
  })().finally(() => {
    programPrefetch = null;
  });
  return programPrefetch;
};

/**
 * Скачать картинки справочника в дисковый кеш expo-image — там же их ищет CatalogImage.
 * Уже скачанные prefetch не тянет заново. Вернёт false, если часть не скачалась (сеть пропала)
 */
export const downloadCatalogMedia = async (
  db: LocalDb,
  onProgress: (progress: MediaProgress) => void,
  isCancelled: () => boolean,
): Promise<boolean> => {
  const urls = catalogImageUrls(db);
  let done = 0;
  let ok = true;
  onProgress({ done, total: urls.length });
  for (let i = 0; i < urls.length; i += MEDIA_CHUNK) {
    if (isCancelled()) return false;
    const chunk = urls.slice(i, i + MEDIA_CHUNK);
    const loaded = await Image.prefetch(chunk, 'disk').catch(() => false);
    ok &&= loaded;
    done += chunk.length;
    onProgress({ done, total: urls.length });
  }
  if (ok) writeMeta(db, META_KEYS.mediaAt, new Date().toISOString());
  return ok;
};
