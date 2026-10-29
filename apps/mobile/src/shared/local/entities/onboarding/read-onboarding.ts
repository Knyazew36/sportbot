import { asc } from 'drizzle-orm';

import type { OnboardingState } from '@sportbot/api/entities/onboarding';

import type { LocalDb } from '@/shared/db';
import { templates } from '@/shared/db/schema';

import { readProfileRow } from '../profile/read-profile';

/** Состояние первого запуска в форме GET onboarding — как OnboardingService.state на сервере */
export const readOnboarding = (db: LocalDb): OnboardingState | null => {
  const row = readProfileRow(db);
  if (!row) return null;
  return {
    step: row.onboardingStep,
    onboarded: !!row.onboardedAt,
    gender: row.gender ?? null,
    trainingDays: row.trainingDays,
    morningTime: row.morningTime,
    eveningTime: row.eveningTime,
    remindersEnabled: row.remindersEnabled,
    questionsEnabled: row.questionsEnabled,
    templates: db
      .select()
      .from(templates)
      .orderBy(asc(templates.position), asc(templates.id))
      .all()
      .map((t) => ({ id: t.id, name: t.name, complexCount: t.complexes.length, tags: t.tags })),
  };
};

/** Настройка закончена по базе телефона; null — профиля в базе ещё нет, решает сервер */
export const readOnboarded = (db: LocalDb): { done: boolean | null } => {
  const row = readProfileRow(db);
  return { done: row ? !!row.onboardedAt : null };
};
