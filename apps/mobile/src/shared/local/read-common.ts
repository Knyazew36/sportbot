import { eq, or } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

import type { LocalDb } from '@/shared/db';
import { joints, limitations } from '@/shared/db/schema';

/** id строки на экране: созданная на телефоне — свой localId навсегда, пришедшая с сервера — серверный */
export const uiIdOf = (row: { id: number | null; localId?: number | null }): number => {
  const id = row.localId ?? row.id;
  if (id == null) throw new Error('Строка без id');
  return id;
};

/** Условие «id экрана»: отрицательный — localId, иначе серверный id */
export const byUiId = (table: { id: SQLiteColumn; localId: SQLiteColumn }, id: number) =>
  id < 0 ? eq(table.localId, id) : or(eq(table.id, id), eq(table.localId, id));

/** Действующие ограничения: id сустава → название зоны строчными, как limitedZones на сервере */
export const limitedZonesOf = (db: Pick<LocalDb, 'select'>, today: string) => {
  const ids = new Set(
    db
      .select()
      .from(limitations)
      .all()
      .filter((l) => !l.cancelledAt && l.startDate <= today && (!l.endDate || l.endDate >= today))
      .map((l) => l.jointId),
  );
  const names = new Map(db.select().from(joints).all().map((j) => [j.id, j.name.toLowerCase()]));
  return (jointIds: number[]) =>
    jointIds
      .filter((id) => ids.has(id))
      .map((id) => names.get(id))
      .filter((name): name is string => !!name);
};
