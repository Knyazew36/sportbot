import { expect } from 'vitest';

import { addDays, localToday, monthStart } from '@/bot';

import { day } from './clock';
import { profileOf } from './fixtures';
import { Harness } from './harness';

const iso = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Тренировка из приложения целиком: старт комплекса дня, одно упражнение сделано, «завершить».
 * @returns id тренировки
 */
export async function train(h: Harness, userId: number): Promise<number> {
  const profile = await profileOf(h.prisma, userId);
  const complex = await h.programs.nextComplex(userId);
  const workout = await h.workouts.start(profile, complex!.id);
  await h.workouts.markDone(userId, workout.exercises[0].id);
  await h.workouts.complete(profile, workout.id);
  return workout.id;
}

/** Статус дня плана на дату; null — записи нет. */
export async function statusOn(
  h: Harness,
  userId: number,
  date: string,
): Promise<string | null> {
  const row = await h.prisma.planDay.findUnique({
    where: { userId_date: { userId, date: day(date) } },
  });
  return row?.status ?? null;
}

export async function calendarMark(
  h: Harness,
  userId: number,
  date: string,
): Promise<string> {
  const month = date.slice(0, 7);
  const days = await h.stats.calendar(userId, undefined, month);
  return days.find((d) => d.date === date)!.mark;
}

export async function weekMark(
  h: Harness,
  userId: number,
  date: string,
): Promise<string> {
  const today = await h.day.today(userId);
  const cell = today.week.find((c) => c.date === date);
  if (!cell) throw new Error(`${date} не в текущей неделе`);
  return cell.mark;
}

/**
 * Инвариант: будущее не бывает пропуском и не влияет на серию (INV-1..3 в training.cases.md).
 * Ошибка перечисляет все нарушения сразу — так проще понять, какой путь их создал.
 */
export async function expectFutureIntact(
  h: Harness,
  userId: number,
): Promise<void> {
  const profile = await profileOf(h.prisma, userId);
  const today = localToday(profile.timeZone);
  const problems: string[] = [];

  const futureMisses = await h.prisma.planDay.findMany({
    where: { userId, status: 'MISSED', date: { gt: today } },
    select: { date: true },
  });
  for (const d of futureMisses)
    problems.push(`INV-1: в базе будущий MISSED на ${iso(d.date)}`);

  const months = [monthStart(today), monthStart(addDays(monthStart(today), 32))];
  for (const first of months) {
    const days = await h.stats.calendar(userId, undefined, iso(first).slice(0, 7));
    for (const d of days)
      if (d.mark === 'MISSED' && day(d.date) > today)
        problems.push(`INV-2: календарь показывает пропуск на ${d.date}`);
  }
  const week = (await h.day.today(userId)).week;
  for (const c of week)
    if (c.mark === 'MISSED' && day(c.date) > today)
      problems.push(`INV-2: неделя показывает пропуск на ${c.date}`);

  const past = await h.prisma.planDay.findMany({
    where: { userId, status: { in: ['DONE', 'MISSED'] }, date: { lte: today } },
    orderBy: { date: 'asc' },
    select: { status: true },
  });
  let current = 0;
  let best = 0;
  for (const d of past) {
    current = d.status === 'DONE' ? current + 1 : 0;
    best = Math.max(best, current);
  }
  const fresh = await profileOf(h.prisma, userId);
  if (fresh.currentStreak !== current || fresh.bestStreak !== best)
    problems.push(
      `INV-3: серия ${fresh.currentStreak}/${fresh.bestStreak}, а по прошлым дням — ${current}/${best}`,
    );

  expect(problems).toEqual([]);
}
