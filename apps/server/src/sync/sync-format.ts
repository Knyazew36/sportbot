/** Дата дня (@db.Date) — 'YYYY-MM-DD'. */
export const dayOf = (date: Date): string => date.toISOString().slice(0, 10);

export const dayOrNull = (date: Date | null): string | null =>
  date ? dayOf(date) : null;

export const timeOf = (date: Date): string => date.toISOString();

export const timeOrNull = (date: Date | null): string | null =>
  date ? date.toISOString() : null;
