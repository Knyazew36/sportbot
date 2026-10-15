import { vi } from 'vitest';

/**
 * Подмена «сейчас». Таймеры не трогаем — на них держатся пул Postgres и Prisma; подменяется только Date.
 */
export function installClock(): void {
  vi.useFakeTimers({ toFake: ['Date'] });
}

export function uninstallClock(): void {
  vi.useRealTimers();
}

/** Московское время (UTC+3, без перехода на летнее): «2026-10-14 10:00». */
export function setMoscow(local: string): Date {
  return setUtc(`${local.replace(' ', 'T')}:00+03:00`);
}

/** Любой момент с явным смещением: «2026-10-14T23:30:00Z». */
export function setUtc(iso: string): Date {
  const now = new Date(iso);
  if (Number.isNaN(now.getTime())) throw new Error(`Плохая дата: ${iso}`);
  vi.setSystemTime(now);
  return now;
}

/** Дата плана, как её хранит база (`@db.Date` — полночь UTC). */
export const day = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);
