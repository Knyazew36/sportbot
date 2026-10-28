import { and, eq, isNull } from 'drizzle-orm';

import type { UpdateProfileDto } from '@sportbot/api/generated/model';
import { newClientId } from '@sportbot/api/entities/workout';
import { localToday, weekdayOf } from '@sportbot/api/lib/time';
import { CITY_ZONES, zoneFromLocalTime, zoneTitle } from '@sportbot/api/lib/timezone';

import type { LocalDb } from '@/shared/db';
import { bodyWeights, joints, limitations, planDays, profile, stretches, stretchExclusions } from '@/shared/db/schema';
import { enqueue, nextLocalId } from '@/shared/sync/outbox';

import { byUiId } from '../../read-common';
import { profileOf } from '../workout/write-workout';

// Настройки, вес, ограничения и исключённые растяжки на телефоне — проверки как на сервере
// (DTO и сервисы profile, body-weight, limitation, stretch-exclusion)

const now = () => new Date().toISOString();

/** Вес тела: от 20 до 400 кг — как CreateBodyWeightDto */
const WEIGHT_MIN = 20;
const WEIGHT_MAX = 400;

// ── Профиль ─────────────────────────────────────────────────────────────────

/**
 * Настройки — только присланные поля. Сегодня убрали из расписания — заведённый день без ответа
 * снимается, как dropUnscheduledToday на сервере
 */
export const updateProfile = (db: LocalDb, dto: UpdateProfileDto): void =>
  db.transaction((tx) => {
    const settings = profileOf(tx);
    const fields = {
      ...dto,
      ...(dto.trainingDays && { trainingDays: [...dto.trainingDays].sort((a, b) => a - b) }),
      ...(dto.displayName !== undefined && { displayName: dto.displayName.trim() }),
    };
    if (fields.displayName === '') throw new Error('Имя не может быть пустым.');
    tx.update(profile).set(fields).run();
    const today = localToday(settings.timeZone);
    if (fields.trainingDays && !fields.trainingDays.includes(weekdayOf(today)))
      tx.delete(planDays)
        .where(
          and(eq(planDays.date, today), eq(planDays.type, 'PLANNED'), eq(planDays.status, 'PENDING'), isNull(planDays.id)),
        )
        .run();
    enqueue(tx, { type: 'profile.update', entity: 'SportProfile', clientId: newClientId(), payload: fields });
  });

/**
 * Пояс — городом из списка или по «сколько у тебя сейчас». Время пересчитывается в пояс сразу:
 * дойди оно до сервера позже, смещение вышло бы другим
 */
export const setTimezone = (db: LocalDb, dto: { zone?: string; localTime?: string }): void =>
  db.transaction((tx) => {
    let zone: string;
    if (dto.zone) {
      if (!CITY_ZONES.some((city) => city.zone === dto.zone)) throw new Error('Такого города нет в списке.');
      zone = dto.zone;
    } else if (dto.localTime) {
      const computed = zoneFromLocalTime(dto.localTime);
      if (!computed) throw new Error('Не понял время. Напиши, сколько у тебя сейчас, например «14:30».');
      zone = computed;
    } else throw new Error('Выбери город или введи текущее время.');
    tx.update(profile).set({ timeZone: zone, timeZoneTitle: zoneTitle(zone) }).run();
    enqueue(tx, { type: 'timezone.set', entity: 'SportProfile', clientId: newClientId(), payload: { zone } });
  });

// ── Вес тела ────────────────────────────────────────────────────────────────

/** Вес за сегодня; повторный ввод за день заменяет значение */
export const addBodyWeight = (db: LocalDb, value: number): void =>
  db.transaction((tx) => {
    if (!(value >= WEIGHT_MIN && value <= WEIGHT_MAX)) throw new Error('Вес — от 20 до 400 кг');
    const date = localToday(profileOf(tx).timeZone);
    const existing = tx.select().from(bodyWeights).where(eq(bodyWeights.date, date)).get();
    let clientId: string;
    if (existing) {
      tx.update(bodyWeights).set({ value }).where(eq(bodyWeights.clientId, existing.clientId)).run();
      clientId = existing.clientId;
    } else {
      clientId = newClientId();
      tx.insert(bodyWeights).values({ clientId, date, value, updatedAt: now() }).run();
    }
    enqueue(tx, { type: 'bodyWeight.add', entity: 'BodyWeight', clientId, payload: { date, value } });
  });

// ── Ограничения ─────────────────────────────────────────────────────────────

/** Ограничение на зону «до даты» или «до отмены»; та же зона повторно — заменяет срок */
export const createLimitation = (db: LocalDb, dto: { jointId: number; endDate?: string | null }): void =>
  db.transaction((tx) => {
    const today = localToday(profileOf(tx).timeZone);
    if (!tx.select().from(joints).where(eq(joints.id, dto.jointId)).get()) throw new Error('Такой зоны нет.');
    const endDate = dto.endDate ?? null;
    if (endDate && endDate < today) throw new Error('Дата окончания уже прошла.');
    tx.update(limitations)
      .set({ cancelledAt: now() })
      .where(and(eq(limitations.jointId, dto.jointId), isNull(limitations.cancelledAt)))
      .run();
    const clientId = newClientId();
    tx.insert(limitations)
      .values({ clientId, localId: nextLocalId(tx), jointId: dto.jointId, startDate: today, endDate, updatedAt: now() })
      .run();
    enqueue(tx, { type: 'limitation.create', entity: 'Limitation', clientId, payload: { jointId: dto.jointId, endDate } });
  });

export const deleteLimitation = (db: LocalDb, id: number): void =>
  db.transaction((tx) => {
    const row = tx.select().from(limitations).where(byUiId(limitations, id)).get();
    if (!row || row.cancelledAt) throw new Error('Ограничение уже снято.');
    tx.update(limitations).set({ cancelledAt: now() }).where(eq(limitations.clientId, row.clientId)).run();
    enqueue(tx, { type: 'limitation.delete', entity: 'Limitation', clientId: row.clientId, payload: {} });
  });

// ── Исключённые растяжки ────────────────────────────────────────────────────

/** Новое исключение — с clientId, который уйдёт на сервер; уже исключённая — без ошибки */
export const addExclusion = (tx: Parameters<Parameters<LocalDb['transaction']>[0]>[0], stretchId: number): string => {
  const existing = tx.select().from(stretchExclusions).where(eq(stretchExclusions.stretchId, stretchId)).get();
  if (existing) return existing.clientId;
  const clientId = newClientId();
  tx.insert(stretchExclusions).values({ clientId, stretchId, updatedAt: now() }).run();
  return clientId;
};

export const createStretchExclusion = (db: LocalDb, stretchId: number): void =>
  db.transaction((tx) => {
    if (!tx.select({ id: stretches.id }).from(stretches).where(eq(stretches.id, stretchId)).get())
      throw new Error('Растяжка не найдена.');
    if (tx.select().from(stretchExclusions).where(eq(stretchExclusions.stretchId, stretchId)).get())
      throw new Error('Растяжка уже исключена.');
    const clientId = addExclusion(tx, stretchId);
    enqueue(tx, { type: 'stretchExclusion.create', entity: 'StretchExclusion', clientId, payload: { stretchId } });
  });

export const deleteStretchExclusion = (db: LocalDb, stretchId: number): void =>
  db.transaction((tx) => {
    const rows = tx.select().from(stretchExclusions).where(eq(stretchExclusions.stretchId, stretchId)).all();
    if (!rows.length) throw new Error('Растяжка не исключена.');
    tx.delete(stretchExclusions).where(eq(stretchExclusions.stretchId, stretchId)).run();
    enqueue(tx, {
      type: 'stretchExclusion.delete',
      entity: 'StretchExclusion',
      clientId: rows[0]!.clientId,
      payload: { stretchId },
    });
  });
