import type { Limitation } from '@sportbot/api/entities/limitation';
import type { StretchExclusion } from '@sportbot/api/entities/stretch-exclusion';
import { localToday } from '@sportbot/api/lib/time';

import type { LocalDb } from '@/shared/db';
import { joints, limitations, muscles, profile, stretches, stretchExclusions } from '@/shared/db/schema';

import { uiIdOf } from '../../read-common';

/** Действующие ограничения — как LimitationService.listByUser */
export const readLimitations = (db: LocalDb): Limitation[] | null => {
  const settings = db.select().from(profile).get();
  if (!settings) return null;
  const today = localToday(settings.timeZone);
  const jointNames = new Map(db.select().from(joints).all().map((j) => [j.id, j.name]));
  return db
    .select()
    .from(limitations)
    .all()
    .filter((l) => !l.cancelledAt && l.startDate <= today && (!l.endDate || l.endDate >= today))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || (a.id ?? Infinity) - (b.id ?? Infinity))
    .map((l) => ({
      id: uiIdOf(l),
      jointId: l.jointId,
      jointName: jointNames.get(l.jointId) ?? '',
      startDate: l.startDate,
      endDate: l.endDate,
    }));
};

/**
 * Исключённые растяжки — как StretchExclusionService.list, новые сверху. Одна растяжка — одна строка:
 * пока синк не свёл исключение с телефона и с сервера, их может быть две
 */
export const readStretchExclusions = (db: LocalDb): StretchExclusion[] | null => {
  if (!db.select({ id: profile.id }).from(profile).get()) return null;
  const rows = db.select().from(stretchExclusions).all();
  const byStretch = new Map(db.select().from(stretches).all().map((s) => [s.id, s]));
  const muscleNames = new Map(db.select().from(muscles).all().map((m) => [m.id, m.name]));
  const seen = new Set<number>();
  return rows
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .filter((r) => !seen.has(r.stretchId) && seen.add(r.stretchId))
    .flatMap((r) => {
      const stretch = byStretch.get(r.stretchId);
      if (!stretch) return [];
      return [
        {
          stretchId: r.stretchId,
          name: stretch.name,
          imageUrl: stretch.imageUrl,
          muscles: stretch.muscleIds
            .map((id) => muscleNames.get(id))
            .filter(Boolean)
            .join(' · '),
          createdAt: r.updatedAt,
        },
      ];
    });
};
