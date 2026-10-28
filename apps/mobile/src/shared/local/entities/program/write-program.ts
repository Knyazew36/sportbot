import { and, asc, eq, inArray } from 'drizzle-orm';

import { newClientId } from '@sportbot/api/entities/workout';
import { nextInQueue } from '@sportbot/api/lib/day';
import { defaultPlan, isTimed, MEASURE_LIMITS } from '@sportbot/api/lib/measure';
import { normalizeSupersets } from '@sportbot/api/lib/superset';
import { localToday } from '@sportbot/api/lib/time';

import type { LocalDb } from '@/shared/db';
import { complexes, complexExercises, exercises, planDays, profile, programs } from '@/shared/db/schema';
import { enqueue, type LocalTx, nextLocalId } from '@/shared/sync/outbox';

import { byUiId, uiIdOf } from '../../read-common';
import { profileOf } from '../workout/write-workout';

// Редактор своих программ на телефоне — порт ProgramService: те же проверки названий и плана,
// те же правила суперсетов (normalizeSupersets) и указателя очереди. На сервер — операциями по clientId

const NAME_MAX = 60;
const SETS_MAX = 20;

type ProgramRow = typeof programs.$inferSelect;
type ComplexRow = typeof complexes.$inferSelect;
type ItemRow = typeof complexExercises.$inferSelect;

const now = () => new Date().toISOString();

const cleanName = (name: string): string => {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed) throw new Error('Название не может быть пустым.');
  if (trimmed.length > NAME_MAX) throw new Error(`Название — до ${NAME_MAX} символов.`);
  return trimmed;
};

const mustProgram = (tx: LocalTx, id: number): ProgramRow => {
  const row = tx.select().from(programs).where(byUiId(programs, id)).get();
  if (!row) throw new Error('Программа не найдена.');
  return row;
};

const mustComplex = (tx: LocalTx, id: number): ComplexRow => {
  const row = tx.select().from(complexes).where(byUiId(complexes, id)).get();
  if (!row) throw new Error('Тренировка не найдена.');
  return row;
};

const mustItem = (tx: LocalTx, id: number): ItemRow => {
  const row = tx.select().from(complexExercises).where(byUiId(complexExercises, id)).get();
  if (!row) throw new Error('Упражнение тренировки не найдено.');
  return row;
};

const complexesOfProgram = (tx: LocalTx, programClientId: string) =>
  tx.select().from(complexes).where(eq(complexes.programClientId, programClientId)).orderBy(asc(complexes.position)).all();

const itemsOf = (tx: LocalTx, complexClientId: string) =>
  tx
    .select()
    .from(complexExercises)
    .where(eq(complexExercises.complexClientId, complexClientId))
    .orderBy(asc(complexExercises.position))
    .all();

const programOfComplex = (tx: LocalTx, complex: ComplexRow) =>
  tx.select().from(programs).where(eq(programs.clientId, complex.programClientId)).get()!;

/**
 * Указатель очереди смотрит на комплекс активной программы: комплекс удалён или программа сменилась —
 * встаёт на первый (repairPointer). reset — на первый принудительно
 */
const repairPointer = (tx: LocalTx, reset = false) => {
  const settings = profileOf(tx);
  const ordered = settings.activeProgramClientId
    ? complexesOfProgram(tx, settings.activeProgramClientId).map((c) => c.clientId)
    : [];
  const next = reset ? (ordered[0] ?? null) : nextInQueue(settings.nextComplexClientId, ordered);
  if (next !== settings.nextComplexClientId) tx.update(profile).set({ nextComplexClientId: next }).run();
};

/** Позиции 1..n и исправленные суперсеты — как applyOrder */
const applyOrder = (tx: LocalTx, order: { clientId: string; superset: number | null }[]) => {
  const normalized = normalizeSupersets(order.map((o, i) => ({ id: i, clientId: o.clientId, superset: o.superset })));
  normalized.forEach((item, index) =>
    tx
      .update(complexExercises)
      .set({ position: index + 1, superset: item.superset })
      .where(eq(complexExercises.clientId, item.clientId))
      .run(),
  );
};

/** Границы плана по мере — как checkPlan на сервере */
const checkPlan = (measure: keyof typeof MEASURE_LIMITS, plan: { sets: number; repsMin: number; repsMax: number }) => {
  const max = MEASURE_LIMITS[measure].plan;
  if (plan.sets < 1 || plan.sets > SETS_MAX || plan.repsMin < 1 || plan.repsMax > max || plan.repsMin > plan.repsMax)
    throw new Error(
      isTimed(measure)
        ? `Подходов — от 1 до ${SETS_MAX}, время — от 1 секунды до 4 часов, минимум не больше максимума.`
        : `Подходов — от 1 до ${SETS_MAX}, повторов — от 1 до ${max}, минимум не больше максимума.`,
    );
};

// ── Программа ───────────────────────────────────────────────────────────────

/** Новая программа; активной нет — становится активной. @returns id экрана */
export const createProgram = (db: LocalDb, name: string): number =>
  db.transaction((tx) => {
    const at = now();
    const row = {
      clientId: newClientId(),
      localId: nextLocalId(tx),
      name: cleanName(name),
      contentUpdatedAt: at,
      publication: 'DRAFT' as const,
      createdAt: at,
      updatedAt: at,
    };
    tx.insert(programs).values(row).run();
    if (!profileOf(tx).activeProgramClientId) {
      tx.update(profile).set({ activeProgramClientId: row.clientId }).run();
      repairPointer(tx, true);
    }
    enqueue(tx, { type: 'program.create', entity: 'Program', clientId: row.clientId, payload: { name: row.name } });
    return row.localId;
  });

export const renameProgram = (db: LocalDb, id: number, name: string): number =>
  db.transaction((tx) => {
    const program = mustProgram(tx, id);
    const clean = cleanName(name);
    tx.update(programs).set({ name: clean }).where(eq(programs.clientId, program.clientId)).run();
    enqueue(tx, { type: 'program.rename', entity: 'Program', clientId: program.clientId, payload: { name: clean } });
    return uiIdOf(program);
  });

/** Удаление: тренировки остаются в истории; была активной — активной программы больше нет */
export const deleteProgram = (db: LocalDb, id: number): void =>
  db.transaction((tx) => {
    const program = mustProgram(tx, id);
    const own = complexesOfProgram(tx, program.clientId).map((c) => c.clientId);
    if (own.length) tx.delete(complexExercises).where(inArray(complexExercises.complexClientId, own)).run();
    tx.delete(complexes).where(eq(complexes.programClientId, program.clientId)).run();
    tx.delete(programs).where(eq(programs.clientId, program.clientId)).run();
    if (profileOf(tx).activeProgramClientId === program.clientId)
      tx.update(profile).set({ activeProgramClientId: null, nextComplexClientId: null }).run();
    enqueue(tx, { type: 'program.delete', entity: 'Program', clientId: program.clientId, payload: {} });
  });

/** Активная программа: указатель очереди встаёт на её первый комплекс */
export const activateProgram = (db: LocalDb, id: number): number =>
  db.transaction((tx) => {
    const program = mustProgram(tx, id);
    tx.update(profile)
      .set({
        activeProgramClientId: program.clientId,
        nextComplexClientId: complexesOfProgram(tx, program.clientId)[0]?.clientId ?? null,
      })
      .run();
    enqueue(tx, { type: 'program.activate', entity: 'Program', clientId: program.clientId, payload: {} });
    return uiIdOf(program);
  });

// ── Комплексы ───────────────────────────────────────────────────────────────

/** Комплекс в конец программы. @returns id экрана программы */
export const addComplex = (db: LocalDb, programId: number, name: string): number =>
  db.transaction((tx) => {
    const program = mustProgram(tx, programId);
    const last = complexesOfProgram(tx, program.clientId).at(-1);
    const row = {
      clientId: newClientId(),
      localId: nextLocalId(tx),
      programClientId: program.clientId,
      name: cleanName(name),
      position: (last?.position ?? 0) + 1,
      updatedAt: now(),
    };
    tx.insert(complexes).values(row).run();
    repairPointer(tx);
    enqueue(tx, {
      type: 'complex.add',
      entity: 'Complex',
      clientId: row.clientId,
      payload: { programClientId: program.clientId, name: row.name },
    });
    return uiIdOf(program);
  });

/** Название и/или разминка (null — как в профиле, 0 — без разминки) */
export const updateComplex = (db: LocalDb, id: number, dto: { name?: string; warmupMinutes?: number | null }): number =>
  db.transaction((tx) => {
    const complex = mustComplex(tx, id);
    const fields = {
      ...(dto.name !== undefined && { name: cleanName(dto.name) }),
      ...(dto.warmupMinutes !== undefined && { warmupMinutes: dto.warmupMinutes }),
    };
    tx.update(complexes).set(fields).where(eq(complexes.clientId, complex.clientId)).run();
    enqueue(tx, { type: 'complex.update', entity: 'Complex', clientId: complex.clientId, payload: fields });
    return uiIdOf(programOfComplex(tx, complex));
  });

export const deleteComplex = (db: LocalDb, id: number): number =>
  db.transaction((tx) => {
    const complex = mustComplex(tx, id);
    const program = programOfComplex(tx, complex);
    tx.delete(complexExercises).where(eq(complexExercises.complexClientId, complex.clientId)).run();
    tx.delete(complexes).where(eq(complexes.clientId, complex.clientId)).run();
    // Указатель очереди на удалённом комплексе — встаёт на первый
    repairPointer(tx);
    enqueue(tx, { type: 'complex.delete', entity: 'Complex', clientId: complex.clientId, payload: {} });
    return uiIdOf(program);
  });

/** Порядок комплексов после перетаскивания: ids — все комплексы программы в новом порядке */
export const reorderComplexes = (db: LocalDb, programId: number, ids: number[]): number =>
  db.transaction((tx) => {
    const program = mustProgram(tx, programId);
    const rows = complexesOfProgram(tx, program.clientId);
    const ordered = ids.map((id) => rows.find((r) => uiIdOf(r) === id)).filter((r): r is ComplexRow => !!r);
    if (ordered.length !== rows.length) throw new Error('Список тренировок устарел — обнови экран.');
    ordered.forEach((row, index) =>
      tx.update(complexes).set({ position: index + 1 }).where(eq(complexes.clientId, row.clientId)).run(),
    );
    enqueue(tx, {
      type: 'complex.reorder',
      entity: 'Program',
      clientId: program.clientId,
      touched: ordered.map((r) => r.clientId),
      payload: { ids: ordered.map((r) => r.clientId) },
    });
    return uiIdOf(program);
  });

/**
 * Следующий в очереди вручную — только комплекс активной программы. Ещё не отмеченный сегодняшний
 * день тоже получает его: утренний выбор не перекроет ручной (как setNext на сервере)
 */
export const makeNextComplex = (db: LocalDb, id: number): number =>
  db.transaction((tx) => {
    const complex = mustComplex(tx, id);
    const settings = profileOf(tx);
    if (complex.programClientId !== settings.activeProgramClientId)
      throw new Error('Этого комплекса нет в активной программе.');
    tx.update(profile).set({ nextComplexClientId: complex.clientId }).run();
    tx.update(planDays)
      .set({ suggestedComplexClientId: complex.clientId })
      .where(and(eq(planDays.date, localToday(settings.timeZone)), eq(planDays.status, 'PENDING')))
      .run();
    enqueue(tx, { type: 'complex.makeNext', entity: 'Complex', clientId: complex.clientId, payload: {} });
    return uiIdOf(programOfComplex(tx, complex));
  });

// ── Упражнения комплекса ────────────────────────────────────────────────────

/**
 * Подбор из справочника: несколько сразу, повторы в списке схлопываются (как на сервере).
 * joinItemId — встать в суперсет этого упражнения сразу за его участниками,
 * newSuperset — собрать выбранные в новый суперсет в конце комплекса
 */
export const addComplexExercises = (
  db: LocalDb,
  complexId: number,
  dto: { exerciseIds: number[]; joinItemId?: number; newSuperset?: boolean },
): number =>
  db.transaction((tx) => {
    const complex = mustComplex(tx, complexId);
    const fresh = [...new Set(dto.exerciseIds)];
    if (dto.newSuperset && fresh.length < 2) throw new Error('Для суперсета выбери хотя бы два упражнения.');
    const measures = new Map(
      tx
        .select({ id: exercises.id, measure: exercises.measure })
        .from(exercises)
        .where(inArray(exercises.id, fresh))
        .all()
        .map((e) => [e.id, e.measure]),
    );
    if (measures.size !== fresh.length) throw new Error('Упражнение не найдено.');

    const current = itemsOf(tx, complex.clientId);
    const order = current.map((e) => ({ clientId: e.clientId, superset: e.superset }));
    // Номер больше всех: applyOrder всё равно перенумерует суперсеты сверху вниз
    const newNo = Math.max(0, ...order.map((e) => e.superset ?? 0)) + 1;
    let insertAt = order.length;
    let superset: number | null = dto.newSuperset ? newNo : null;
    let joinClientId: string | undefined;
    if (dto.joinItemId !== undefined) {
      const anchorRow = mustItem(tx, dto.joinItemId);
      const anchorIndex = order.findIndex((e) => e.clientId === anchorRow.clientId);
      if (anchorIndex < 0) throw new Error('Упражнение тренировки не найдено.');
      const anchor = order[anchorIndex]!;
      anchor.superset ??= newNo;
      superset = anchor.superset;
      joinClientId = anchorRow.clientId;
      insertAt = anchorIndex + 1;
      while (order[insertAt]?.superset === superset) insertAt++;
    }

    const at = now();
    const created = fresh.map((exerciseId) => ({
      clientId: newClientId(),
      localId: nextLocalId(tx),
      complexClientId: complex.clientId,
      exerciseId,
      position: 0,
      ...((plan) => ({ sets: plan.sets, repsMin: plan.repsMin, repsMax: plan.repsMax }))(defaultPlan(measures.get(exerciseId)!)),
      superset,
      updatedAt: at,
    }));
    tx.insert(complexExercises).values(created).run();
    order.splice(insertAt, 0, ...created.map((c) => ({ clientId: c.clientId, superset })));
    applyOrder(tx, order);
    enqueue(tx, {
      type: 'complexItem.add',
      entity: 'Complex',
      clientId: complex.clientId,
      touched: created.map((c) => c.clientId),
      payload: {
        items: created.map((c) => ({ clientId: c.clientId, exerciseId: c.exerciseId })),
        joinItemClientId: joinClientId,
        newSuperset: dto.newSuperset,
      },
    });
    return uiIdOf(programOfComplex(tx, complex));
  });

/** План подходов упражнения комплекса */
export const updateComplexExercise = (
  db: LocalDb,
  id: number,
  plan: { sets: number; repsMin: number; repsMax: number },
): number =>
  db.transaction((tx) => {
    const item = mustItem(tx, id);
    const measure = tx.select({ measure: exercises.measure }).from(exercises).where(eq(exercises.id, item.exerciseId)).get();
    if (!measure) throw new Error('Упражнение не найдено.');
    checkPlan(measure.measure, plan);
    tx.update(complexExercises).set(plan).where(eq(complexExercises.clientId, item.clientId)).run();
    enqueue(tx, { type: 'complexItem.update', entity: 'ComplexExercise', clientId: item.clientId, payload: plan });
    return uiIdOf(programOfComplex(tx, mustComplexByClient(tx, item.complexClientId)));
  });

const mustComplexByClient = (tx: LocalTx, clientId: string) =>
  tx.select().from(complexes).where(eq(complexes.clientId, clientId)).get()!;

/** Убрать упражнение; из суперсета на двоих остаётся одиночное */
export const deleteComplexExercise = (db: LocalDb, id: number): number =>
  db.transaction((tx) => {
    const item = mustItem(tx, id);
    tx.delete(complexExercises).where(eq(complexExercises.clientId, item.clientId)).run();
    if (item.superset !== null) applyOrder(tx, itemsOf(tx, item.complexClientId));
    enqueue(tx, { type: 'complexItem.delete', entity: 'ComplexExercise', clientId: item.clientId, payload: {} });
    return uiIdOf(programOfComplex(tx, mustComplexByClient(tx, item.complexClientId)));
  });

/** Порядок упражнений: ids — все упражнения комплекса в новом порядке, суперсеты чинятся сами */
export const reorderComplexExercises = (db: LocalDb, complexId: number, ids: number[]): number =>
  db.transaction((tx) => {
    const complex = mustComplex(tx, complexId);
    const rows = itemsOf(tx, complex.clientId);
    const ordered = ids.map((id) => rows.find((r) => uiIdOf(r) === id)).filter((r): r is ItemRow => !!r);
    if (ordered.length !== rows.length) throw new Error('Список упражнений устарел — обнови экран.');
    applyOrder(tx, ordered);
    enqueue(tx, {
      type: 'complexItem.reorder',
      entity: 'Complex',
      clientId: complex.clientId,
      touched: ordered.map((r) => r.clientId),
      payload: { ids: ordered.map((r) => r.clientId) },
    });
    return uiIdOf(programOfComplex(tx, complex));
  });

/** Вынести упражнение из суперсета: встаёт сразу за блоком */
export const ungroupComplexExercise = (db: LocalDb, id: number): number =>
  db.transaction((tx) => {
    const item = mustItem(tx, id);
    if (item.superset === null) throw new Error('Упражнение не в суперсете.');
    const order = itemsOf(tx, item.complexClientId)
      .filter((e) => e.clientId !== item.clientId)
      .map((e) => ({ clientId: e.clientId, superset: e.superset }));
    const lastMember = order.findLastIndex((e) => e.superset === item.superset);
    order.splice(lastMember + 1, 0, { clientId: item.clientId, superset: null });
    applyOrder(tx, order);
    enqueue(tx, { type: 'complexItem.ungroup', entity: 'ComplexExercise', clientId: item.clientId, payload: {} });
    return uiIdOf(programOfComplex(tx, mustComplexByClient(tx, item.complexClientId)));
  });

/** Разгруппировать суперсет целиком: упражнения остаются на своих местах */
export const ungroupSuperset = (db: LocalDb, complexId: number, superset: number): number =>
  db.transaction((tx) => {
    const complex = mustComplex(tx, complexId);
    const items = itemsOf(tx, complex.clientId);
    if (!items.some((e) => e.superset === superset)) throw new Error('Суперсет не найден.');
    applyOrder(
      tx,
      items.map((e) => ({ clientId: e.clientId, superset: e.superset === superset ? null : e.superset })),
    );
    enqueue(tx, { type: 'superset.ungroup', entity: 'Complex', clientId: complex.clientId, payload: { superset } });
    return uiIdOf(programOfComplex(tx, complex));
  });
