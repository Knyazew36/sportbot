import { asc, eq } from 'drizzle-orm';

import type { OnboardingDaysDto, OnboardingGenderDto, OnboardingTimesDto } from '@sportbot/api/generated/model';
import { newClientId } from '@sportbot/api/entities/workout';

import type { LocalDb } from '@/shared/db';
import { complexes, complexExercises, profile, programs, templates } from '@/shared/db/schema';
import { enqueue, type LocalTx, nextLocalId } from '@/shared/sync/outbox';

import { profileOf } from '../workout/write-workout';

// Первый запуск на телефоне — порт OnboardingService: шаг двигается только вперёд,
// конец настройки заводит программу сразу здесь, на сервер всё уходит операциями onboarding.*

/** Шаги сервера: дни, время вопросов, программа — как ONBOARDING_STEPS */
const ONBOARDING_STEPS = 3;
const SCRATCH_NAME = 'Моя программа';

/** Выбор последнего шага: шаблон или с нуля */
export type OnboardingFinishInput = { templateId: number } | { scratch: true };

type SourceClientId = { sourceId: number; clientId: string };

const now = () => new Date().toISOString();

/** Шаг вперёд только с текущего: правка прошлого шага кнопкой «Назад» не откатывает прогресс */
const nextStep = (tx: LocalTx, done: number) => Math.max(profileOf(tx).onboardingStep, done + 1);

const enqueueStep = (tx: LocalTx, type: string, payload: Record<string, unknown>) =>
  enqueue(tx, { type, entity: 'SportProfile', clientId: newClientId(), payload });

const insertProgram = (
  tx: LocalTx,
  row: { clientId: string; name: string; at: string; sourceProgramId?: number; sourceSyncedAt?: string },
) =>
  tx
    .insert(programs)
    .values({
      clientId: row.clientId,
      localId: nextLocalId(tx),
      name: row.name,
      sourceProgramId: row.sourceProgramId ?? null,
      sourceSyncedAt: row.sourceSyncedAt ?? null,
      fromTemplate: row.sourceProgramId !== undefined,
      contentUpdatedAt: row.at,
      publication: 'DRAFT',
      createdAt: row.at,
      updatedAt: row.at,
    })
    .run();

// ── Шаги ────────────────────────────────────────────────────────────────────

export const saveGender = (db: LocalDb, dto: OnboardingGenderDto): void =>
  db.transaction((tx) => {
    profileOf(tx);
    tx.update(profile).set({ gender: dto.gender }).run();
    enqueueStep(tx, 'onboarding.gender', { ...dto });
  });

export const saveDays = (db: LocalDb, dto: OnboardingDaysDto): void =>
  db.transaction((tx) => {
    const trainingDays = [...dto.trainingDays].sort((a, b) => a - b);
    tx.update(profile).set({ trainingDays, onboardingStep: nextStep(tx, 1) }).run();
    enqueueStep(tx, 'onboarding.days', { trainingDays });
  });

export const saveTimes = (db: LocalDb, dto: OnboardingTimesDto): void =>
  db.transaction((tx) => {
    tx.update(profile)
      .set({
        morningTime: dto.morningTime,
        eveningTime: dto.eveningTime,
        // Необязательные: не пришли — остаются как были, как у сервера
        ...(dto.remindersEnabled !== undefined && { remindersEnabled: dto.remindersEnabled }),
        ...(dto.questionsEnabled !== undefined && { questionsEnabled: dto.questionsEnabled }),
        onboardingStep: nextStep(tx, 2),
      })
      .run();
    enqueueStep(tx, 'onboarding.times', { ...dto });
  });

// ── Конец настройки ─────────────────────────────────────────────────────────

/**
 * Программа (с нуля или копия шаблона) становится активной, настройка закончена.
 * Сервер заводит её с теми же clientId — pull не привезёт вторую копию. Уже закончена — ничего не делаем
 */
export const finishOnboarding = (db: LocalDb, input: OnboardingFinishInput): void =>
  db.transaction((tx) => {
    if (profileOf(tx).onboardedAt) return;
    const at = now();
    const programClientId = newClientId();
    const complexIds: SourceClientId[] = [];
    const itemIds: SourceClientId[] = [];

    if ('scratch' in input) {
      insertProgram(tx, { clientId: programClientId, name: SCRATCH_NAME, at });
    } else {
      const template = tx.select().from(templates).where(eq(templates.id, input.templateId)).get();
      if (!template) throw new Error('Шаблон не найден.');
      insertProgram(tx, {
        clientId: programClientId,
        name: template.name,
        at,
        sourceProgramId: template.id,
        sourceSyncedAt: template.contentUpdatedAt,
      });
      for (const complex of template.complexes) {
        const complexClientId = newClientId();
        complexIds.push({ sourceId: complex.id, clientId: complexClientId });
        tx.insert(complexes)
          .values({
            clientId: complexClientId,
            localId: nextLocalId(tx),
            programClientId,
            name: complex.name,
            position: complex.position,
            cardioName: complex.cardioName,
            cardioMinutes: complex.cardioMinutes,
            warmupMinutes: complex.warmupMinutes,
            updatedAt: at,
          })
          .run();
        for (const item of complex.exercises) {
          const itemClientId = newClientId();
          itemIds.push({ sourceId: item.id, clientId: itemClientId });
          tx.insert(complexExercises)
            .values({
              clientId: itemClientId,
              localId: nextLocalId(tx),
              complexClientId,
              exerciseId: item.exerciseId,
              position: item.position,
              sets: item.sets,
              repsMin: item.repsMin,
              repsMax: item.repsMax,
              superset: item.superset,
              updatedAt: at,
            })
            .run();
        }
      }
    }

    const first = tx
      .select({ clientId: complexes.clientId })
      .from(complexes)
      .where(eq(complexes.programClientId, programClientId))
      .orderBy(asc(complexes.position))
      .get();
    tx.update(profile)
      .set({
        activeProgramId: null,
        activeProgramClientId: programClientId,
        nextComplexId: null,
        nextComplexClientId: first?.clientId ?? null,
        onboardingStep: ONBOARDING_STEPS,
        onboardedAt: at,
      })
      .run();
    enqueue(tx, {
      type: 'onboarding.finish',
      entity: 'Program',
      clientId: programClientId,
      payload: { ...input, programClientId, complexes: complexIds, items: itemIds },
      // Строки копии ждут ответа сервера: pull до отправки их не трогает
      touched: [...complexIds, ...itemIds].map((row) => row.clientId),
    });
  });
