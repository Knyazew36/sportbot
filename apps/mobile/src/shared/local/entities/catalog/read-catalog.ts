import { asc, eq } from 'drizzle-orm';

import type {
  CatalogExercise,
  CatalogListItem,
  CatalogRef,
  CatalogStretch,
  ExerciseFilter,
  StretchFilter,
} from '@sportbot/api/entities/catalog';
import type { PaginationMeta } from '@sportbot/api/generated/model';
import { matchesWords, searchWords } from '@sportbot/api/lib/catalog-search';

import type { LocalDb } from '@/shared/db';
import { exercises, joints, muscles, stretches } from '@/shared/db/schema';

export type CatalogPage = { items: CatalogListItem[]; meta: PaginationMeta };

const ref = (item: { id: number; code: string; name: string }): CatalogRef => ({
  id: item.id,
  code: item.code,
  name: item.name,
});

/** Справочника в базе ещё нет — до первого синка отвечает сервер */
const hasCatalog = (db: LocalDb) => !!db.select({ id: muscles.id }).from(muscles).get();

export const readMuscles = (db: LocalDb): CatalogRef[] | null =>
  hasCatalog(db) ? db.select().from(muscles).orderBy(asc(muscles.bodyOrder)).all().map(ref) : null;

export const readJoints = (db: LocalDb): CatalogRef[] | null =>
  hasCatalog(db) ? db.select().from(joints).orderBy(asc(joints.id)).all().map(ref) : null;

const muscleNames = (db: LocalDb) => new Map(db.select().from(muscles).all().map((m) => [m.id, m.name]));

/** filter_muscle — id через запятую, как в запросе к серверу */
const muscleIdsOf = (filter?: string) =>
  filter ? filter.split(',').map(Number).filter(Number.isInteger) : [];

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'ru');

/** Страница выдачи — как paginatePrisma на сервере: экран листает так же, как раньше */
const pageOf = (items: CatalogListItem[], page: number, limit: number): CatalogPage => {
  const totalPages = Math.max(1, Math.ceil(items.length / limit));
  return {
    items: items.slice((page - 1) * limit, page * limit),
    meta: {
      total: items.length,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/** Выдача упражнений — как CatalogAppService.exercises: слова названия, основная мышца, инвентарь */
export const readExercisePage = (db: LocalDb, filter: ExerciseFilter, page: number, limit: number): CatalogPage | null => {
  if (!hasCatalog(db)) return null;
  const words = searchWords(filter.search);
  const muscleIds = muscleIdsOf(filter.filter_muscle);
  const names = muscleNames(db);
  const items = db
    .select()
    .from(exercises)
    .all()
    .filter(
      (e) =>
        matchesWords(e.nameNormalized, words) &&
        (!muscleIds.length || e.muscles.some((m) => m.role === 'PRIMARY' && muscleIds.includes(m.muscleId))) &&
        (!filter.filter_equipment || e.equipment === filter.filter_equipment),
    )
    .sort(byName)
    .map(
      (e): CatalogListItem => ({
        id: e.id,
        name: e.name,
        muscles: e.muscles
          .filter((m) => m.role === 'PRIMARY')
          .map((m) => names.get(m.muscleId))
          .filter(Boolean)
          .join(' · '),
        imageUrl: e.imageUrl,
        equipment: e.equipment,
        holdSeconds: null,
        draft: e.draft,
      }),
    );
  return pageOf(items, page, limit);
};

/** Выдача растяжек — как CatalogAppService.stretches: слова названия и любая мышца */
export const readStretchPage = (db: LocalDb, filter: StretchFilter, page: number, limit: number): CatalogPage | null => {
  if (!hasCatalog(db)) return null;
  const words = searchWords(filter.search);
  const muscleIds = muscleIdsOf(filter.filter_muscle);
  const names = muscleNames(db);
  const items = db
    .select()
    .from(stretches)
    .all()
    .filter(
      (s) =>
        matchesWords(s.nameNormalized, words) &&
        (!muscleIds.length || s.muscleIds.some((id) => muscleIds.includes(id))),
    )
    .sort(byName)
    .map(
      (s): CatalogListItem => ({
        id: s.id,
        name: s.name,
        muscles: s.muscleIds
          .map((id) => names.get(id))
          .filter(Boolean)
          .join(' · '),
        imageUrl: s.imageUrl,
        equipment: null,
        holdSeconds: s.holdSeconds,
        draft: s.draft,
      }),
    );
  return pageOf(items, page, limit);
};

// Черновики карточкой — только с сервера: заявок на проверку локальная база не знает.
// У опубликованной записи без них прячется лишь плашка «правка на проверке» — в зале она не нужна
const NO_REVIEW = { mine: false, pendingReview: false, canPublish: false } as const;

export const readExercise = (db: LocalDb, id: number): CatalogExercise | null => {
  const e = db.select().from(exercises).where(eq(exercises.id, id)).get();
  if (!e || e.draft) return null;
  const muscleRefs = new Map(db.select().from(muscles).all().map((m) => [m.id, ref(m)]));
  const jointRefs = new Map(db.select().from(joints).all().map((j) => [j.id, ref(j)]));
  const musclesOf = (role: 'PRIMARY' | 'SECONDARY') =>
    e.muscles
      .filter((m) => m.role === role)
      .map((m) => muscleRefs.get(m.muscleId))
      .filter((m): m is CatalogRef => !!m);

  return {
    id: e.id,
    name: e.name,
    imageUrl: e.imageUrl,
    technique: e.technique,
    steps: e.steps,
    mistakes: e.mistakes,
    imageEndUrl: e.imageEndUrl,
    imageCredit: e.imageCredit,
    videoUrl: e.videoUrl,
    equipment: e.equipment,
    measure: e.measure,
    primaryMuscles: musclesOf('PRIMARY'),
    secondaryMuscles: musclesOf('SECONDARY'),
    joints: e.jointIds.map((jointId) => jointRefs.get(jointId)).filter((j): j is CatalogRef => !!j),
    draft: false,
    ...NO_REVIEW,
  };
};

export const readStretch = (db: LocalDb, id: number): CatalogStretch | null => {
  const s = db.select().from(stretches).where(eq(stretches.id, id)).get();
  if (!s || s.draft) return null;
  const muscleRefs = new Map(db.select().from(muscles).all().map((m) => [m.id, ref(m)]));

  return {
    id: s.id,
    name: s.name,
    imageUrl: s.imageUrl,
    howTo: s.howTo,
    steps: s.steps,
    mistakes: s.mistakes,
    imageEndUrl: s.imageEndUrl,
    feel: s.feel,
    videoUrl: s.videoUrl,
    imageCredit: s.imageCredit,
    holdSeconds: s.holdSeconds,
    perSide: s.perSide,
    muscles: s.muscleIds.map((muscleId) => muscleRefs.get(muscleId)).filter((m): m is CatalogRef => !!m),
    draft: false,
    ...NO_REVIEW,
  };
};
