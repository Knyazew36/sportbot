import { describe, expect, it } from 'vitest';

import { setMoscow } from '../support/clock';
import { createAthlete, seedPlanDay } from '../support/fixtures';
import { useHarness } from '../support/harness';
import {
  calendarMark,
  expectFutureIntact,
  weekMark,
} from '../support/training';

// Опорная неделя: Пн 12.10.2026 … Вс 18.10.2026, тренировки Пн/Ср/Пт
describe('A. Отображение без действий', () => {
  const harness = useHarness();

  it('A1: будущие дни в календаре — FUTURE, прошлые без записи — REST', async () => {
    const h = harness();
    setMoscow('2026-10-14 10:00');
    const { userId } = await createAthlete(h.prisma);

    expect(await calendarMark(h, userId, '2026-10-16')).toBe('FUTURE');
    expect(await calendarMark(h, userId, '2026-10-31')).toBe('FUTURE');
    expect(await calendarMark(h, userId, '2026-10-12')).toBe('REST');
    await expectFutureIntact(h, userId);
  });

  it('A2: неделя — впереди тренировочный PLAN, выходные REST, прошлые без записи REST', async () => {
    const h = harness();
    setMoscow('2026-10-14 10:00');
    const { userId } = await createAthlete(h.prisma);

    expect(await weekMark(h, userId, '2026-10-16')).toBe('PLAN');
    expect(await weekMark(h, userId, '2026-10-17')).toBe('REST');
    expect(await weekMark(h, userId, '2026-10-18')).toBe('REST');
    expect(await weekMark(h, userId, '2026-10-12')).toBe('REST');
    expect(await weekMark(h, userId, '2026-10-13')).toBe('REST');
  });

  it('A3: сегодняшний PENDING — «ждёт ответа» в календаре и PLAN в неделе', async () => {
    const h = harness();
    setMoscow('2026-10-14 10:00');
    const { userId } = await createAthlete(h.prisma);
    await seedPlanDay(h.prisma, userId, '2026-10-14');

    expect(await calendarMark(h, userId, '2026-10-14')).toBe('PENDING');
    expect(await weekMark(h, userId, '2026-10-14')).toBe('PLAN');
    await expectFutureIntact(h, userId);
  });
});
