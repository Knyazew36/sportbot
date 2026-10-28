import { useMutation, useQuery } from '@tanstack/react-query';

import type { AddSetVars, DeleteSetVars, FinishVars, UpdateSetVars, Workout } from '@sportbot/api/entities/workout';
import {
  workoutControllerAnalogs,
  workoutControllerCooldown,
  workoutControllerCurrent,
  workoutControllerFind,
  workoutControllerShare,
  workoutControllerSummary,
} from '@sportbot/api/generated/workout/workout';

import { useIsOnline } from '@/shared/api';
import { type LocalDb, useLocalDb } from '@/shared/db';
import { workouts } from '@/shared/db/schema';
import { useSyncStatus } from '@/shared/sync';
import { pendingCount } from '@/shared/sync/outbox';

import { LOCAL_ROOT, useLocalQuery } from '../../local-query';
import { byUiId } from '../../read-common';
import {
  DONE_STATUSES,
  findWorkoutRow,
  readAnalogs,
  readCurrentWorkout,
  readSavedCooldown,
  readSummary,
  readWorkout,
} from './read-workout';
import {
  addItems,
  addSet,
  cooldownFinish,
  cooldownFor,
  cooldownStart,
  deleteSet,
  deleteWorkout,
  discardWorkout,
  excludeCooldownStretch,
  finishWorkout,
  removeItem,
  replaceItem,
  startWorkout,
  updateSet,
  warmupFinish,
} from './write-workout';

// Тренировка целиком на базе телефона: правка пишется в базу и в очередь операций, экран видит её сразу,
// на сервер она уходит синком (MutationCache зовёт requestSync после каждой). Сеть для тренировки не нужна

const useDb = () => {
  const db = useLocalDb();
  return (): LocalDb => {
    if (!db) throw new Error('База на телефоне ещё открывается — повторите через секунду');
    return db;
  };
};

/** Тренировка после правки — экран получает её ответом мутации, как раньше от сервера */
const viewOf = (db: LocalDb, id: number): Workout => {
  const workout = readWorkout(db, id);
  if (!workout) throw new Error('Тренировка не найдена.');
  return workout;
};

/** REST как запасной путь — только для строк с серверным id */
const serverOnly = <T>(id: number, load: (id: number) => Promise<T>) =>
  id > 0 ? load(id) : Promise.reject(new Error('Тренировка ещё не загружена'));

// ── Чтение ──────────────────────────────────────────────────────────────────

/** Незавершённая тренировка: начатая в боте приедет с синком */
export const useCurrentWorkout = () =>
  useLocalQuery({ key: ['workout', 'current'], read: readCurrentWorkout, fallback: () => workoutControllerCurrent() });

/** Тренировка по id — протокол, правка из статистики */
export const useWorkout = (id: number) =>
  useLocalQuery({
    key: ['workout', 'detail', id],
    read: (db) => readWorkout(db, id),
    fallback: () => serverOnly(id, workoutControllerFind),
  });

export const useWorkoutSummary = (id: number) =>
  useLocalQuery({
    key: ['workout', 'summary', id],
    read: (db) => readSummary(db, id),
    fallback: () => serverOnly(id, workoutControllerSummary),
  });

/** Заминка: набор собирается один раз и при повторном открытии не меняется */
export const useCooldown = (workoutId: number) =>
  useLocalQuery({
    key: ['workout', 'cooldown', workoutId],
    read: (db) => {
      if (!findWorkoutRow(db, workoutId)) return null;
      return readSavedCooldown(db, cooldownFor(db, workoutId));
    },
    fallback: () => serverOnly(workoutId, workoutControllerCooldown),
  });

export const useAnalogs = (itemId: number) =>
  useLocalQuery({
    key: ['workout', 'analogs', itemId],
    read: (db) => readAnalogs(db, itemId),
    fallback: () => serverOnly(itemId, workoutControllerAnalogs),
  });

// ── Старт и подходы ─────────────────────────────────────────────────────────

export const useStartWorkout = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (complexId?: number): Promise<Workout> => {
      const row = startWorkout(db(), complexId);
      return viewOf(db(), row.localId ?? row.id!);
    },
    // Экран тренировки открывается сам — он и есть подтверждение
    meta: { skipSuccessToast: true },
  });
};

export const useAddSet = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (vars: AddSetVars) => addSet(db(), vars),
    // Подход сразу в списке и запускается таймер отдыха — тост лишний
    meta: { skipSuccessToast: true },
  });
};

export const useUpdateSet = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (vars: UpdateSetVars) => updateSet(db(), vars),
    // Исправленные цифры видны в списке сразу
    meta: { skipSuccessToast: true },
  });
};

export const useDeleteSet = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (vars: DeleteSetVars) => deleteSet(db(), vars),
    // Подход пропадает из списка сразу
    meta: { skipSuccessToast: true },
  });
};

// ── Упражнения ──────────────────────────────────────────────────────────────

export const useReplaceItem = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (vars: { itemId: number; exerciseId: number; inComplex?: boolean }) =>
      viewOf(db(), replaceItem(db(), vars)),
    meta: { successMessage: 'Упражнение заменено' },
  });
};

export const useAddItems = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (vars: { workoutId: number; exerciseIds: number[]; inComplex?: boolean }) => {
      addItems(db(), vars);
      return viewOf(db(), vars.workoutId);
    },
    meta: { successMessage: 'Упражнение добавлено' },
  });
};

/** Убрать упражнение из тренировки вместе с подходами */
export const useRemoveItem = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (itemId: number) => viewOf(db(), removeItem(db(), itemId)),
    meta: { successMessage: 'Упражнение убрано' },
  });
};

// ── Разминка, заминка, конец ────────────────────────────────────────────────

export const useWarmupFinish = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (workoutId: number) => warmupFinish(db(), workoutId),
    // Переход к упражнениям и так виден на экране
    meta: { skipSuccessToast: true },
  });
};

export const useCooldownStart = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (workoutId: number) => cooldownStart(db(), workoutId),
    // Заминка уже идёт на экране — отметка времени фоновая
    meta: { skipSuccessToast: true },
  });
};

export const useCooldownFinish = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (workoutId: number) => cooldownFinish(db(), workoutId),
    // После заминки сразу уходим на итог — там и видно её время
    meta: { skipSuccessToast: true },
  });
};

/** «Не предлагать» в заминке: растяжка исключается навсегда, здесь меняется на другую на те же мышцы */
export const useExcludeCooldownStretch = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async ({ workoutId, stretchId }: { workoutId: number; stretchId: number }) => {
      excludeCooldownStretch(db(), workoutId, stretchId);
      const workout = findWorkoutRow(db(), workoutId);
      const cooldown = workout && readSavedCooldown(db(), workout);
      if (!cooldown) throw new Error('Заминка не найдена.');
      return cooldown;
    },
    meta: { successMessage: 'Больше не предложим эту растяжку' },
  });
};

/** Завершение засчитывается сразу на телефоне: день, серия и заминка — без сети */
export const useFinishWorkout = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (vars: FinishVars) => readSummary(db(), finishWorkout(db(), vars)),
    // Засчитанность видна на весь экран: следом предложение заминки
    meta: { skipSuccessToast: true },
  });
};

export const useDiscardWorkout = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (id: number) => discardWorkout(db(), id),
    meta: { successMessage: 'Тренировка отменена' },
  });
};

/** Удалить прошедшую тренировку: день в календаре становится пропуском, серия пересчитывается */
export const useDeleteWorkout = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (id: number) => deleteWorkout(db(), id),
    meta: { successMessage: 'Тренировка удалена' },
  });
};

/** «Поделиться» — только через сервер: карточку присылает бот. Тренировке нужен серверный id */
export const useShareWorkout = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (id: number) => {
      const serverId = id > 0 ? id : findWorkoutRow(db(), id)?.id;
      if (!serverId) throw new Error('Тренировка ещё не дошла до сервера — подключитесь к интернету');
      return workoutControllerShare(serverId);
    },
    meta: { successMessage: 'Карточка в чате с ботом — перешли её друзьям' },
  });
};

// ── Состояние синка ─────────────────────────────────────────────────────────

/** Тренировка уже засчитана на телефоне — экран тренировки уводит на итог */
export const useFinishSucceeded = (workoutId: number | undefined): boolean => {
  const db = useLocalDb();
  const query = useQuery({
    queryKey: [LOCAL_ROOT, 'workout', 'finished', workoutId ?? 0],
    queryFn: () => {
      const row = db && workoutId ? db.select({ status: workouts.status }).from(workouts).where(byUiId(workouts, workoutId)).get() : null;
      return DONE_STATUSES.some((s) => s === row?.status);
    },
    enabled: !!db && workoutId != null,
    staleTime: Infinity,
  });
  return query.data ?? false;
};

/** Без сервера ждать нечего: завершение засчитано на телефоне сразу */
export const useFinishQueued = (_workoutId: number | undefined): boolean => false;

/** Тренировка уже такая, как в базе телефона: накладывать неотправленное не нужно */
export const useQueuedWorkout = <T extends Workout | null | undefined>(workout: T) => ({ workout, finishing: false });

/** Шапка тренировки: есть ли сеть, сколько правок ещё не на сервере и не застряла ли отправка */
export const useWorkoutSync = () => {
  const db = useLocalDb();
  const online = useIsOnline();
  const status = useSyncStatus();
  const pending = useQuery({
    queryKey: [LOCAL_ROOT, 'outbox', 'count'],
    queryFn: () => (db ? pendingCount(db) : 0),
    enabled: !!db,
    staleTime: Infinity,
  });
  return {
    online,
    pending: pending.data ?? 0,
    retrying: status.phase === 'error' || (online && status.phase === 'offline'),
  };
};
