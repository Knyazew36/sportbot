import { desc } from 'drizzle-orm';

import type { Profile } from '@sportbot/api/entities/profile';
import { activePauseOf } from '@sportbot/api/lib/day';
import { localToday } from '@sportbot/api/lib/time';

import type { LocalDb } from '@/shared/db';
import { bodyWeights, pauses, profile } from '@/shared/db/schema';

export type ProfileRow = typeof profile.$inferSelect;

export const readProfileRow = (db: LocalDb): ProfileRow | undefined => db.select().from(profile).get();

/** Профиль в форме GET profile — как ProfileAppService.view на сервере */
export const readProfile = (db: LocalDb): Profile | null => {
  const row = readProfileRow(db);
  if (!row) return null;
  const today = localToday(row.timeZone);
  const pause = activePauseOf(db.select().from(pauses).all(), today);
  const weight = db.select({ value: bodyWeights.value }).from(bodyWeights).orderBy(desc(bodyWeights.date)).get();

  return {
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    gender: row.gender,
    timeZone: row.timeZone,
    timeZoneTitle: row.timeZoneTitle,
    trainingDays: row.trainingDays,
    morningTime: row.morningTime,
    eveningTime: row.eveningTime,
    remindersEnabled: row.remindersEnabled,
    questionsEnabled: row.questionsEnabled,
    weightAskFrequency: row.weightAskFrequency,
    showRestTimer: row.showRestTimer,
    restSeconds: row.restSeconds,
    restAutoStart: row.restAutoStart,
    timerSound: row.timerSound,
    timerVibration: row.timerVibration,
    warmupMinutes: row.warmupMinutes,
    pause: pause && { endDate: pause.endDate, expired: !!pause.endDate && pause.endDate < today },
    lastBodyWeight: weight?.value ?? null,
  };
};
