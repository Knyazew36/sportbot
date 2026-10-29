import type { DayFixDto } from '@sportbot/api/generated/model';
import { dayControllerToday } from '@sportbot/api/generated/day/day';

import { queryClient } from '@/shared/api/query-client';
import { type LocalDb, useLocalDb } from '@/shared/db';

import { useLocalMutation } from '../../local-mutation';
import { LOCAL_ROOT, useLocalQuery } from '../../local-query';
import { readToday } from './read-today';
import { endPause, eveningAnswer, fixDay, pickComplex, rescheduleAnswer, skipDay, startPause } from './write-day';

// День и пауза на базе телефона: ответ пишется сразу, «Сегодня» перечитывается от изменения базы,
// сервер узнаёт из очереди: SyncRunner отправит её, когда правки притихнут

const useDb = () => {
  const db = useLocalDb();
  return (): LocalDb => {
    if (!db) throw new Error('База на телефоне ещё открывается — повторите через секунду');
    return db;
  };
};

/** Сегодня: состояние дня из локальной базы — экран открывается и без сети */
export const useToday = () =>
  useLocalQuery({ key: ['day', 'today'], read: readToday, fallback: () => dayControllerToday() });

/** «Другая тренировка»: выбор сохраняется в день и переживает перезаход */
export const usePickComplex = () => {
  const db = useDb();
  return useLocalMutation({
    mutationFn: async (complexId: number) => pickComplex(db(), complexId),
    // Новый комплекс сразу виден на экране дня
    meta: { skipSuccessToast: true },
  });
};

/** «Сегодня не буду» — как утреннее «нет» в боте */
export const useSkipDay = () => {
  const db = useDb();
  return useLocalMutation({
    mutationFn: async () => skipDay(db()),
    meta: { successMessage: 'Записал пропуск' },
  });
};

/** Вечерний ответ «потренировался сегодня?» */
export const useEveningAnswer = () => {
  const db = useDb();
  return useLocalMutation({
    mutationFn: async (yes: boolean) => eveningAnswer(db(), yes),
    // Итог — засчитано или пропуск — сразу виден на экране дня
    meta: { skipSuccessToast: true },
  });
};

/** Ответ на «напомнить завтра?» */
export const useRescheduleAnswer = () => {
  const db = useDb();
  return useLocalMutation({
    mutationFn: async (accept: boolean) => rescheduleAnswer(db(), accept),
    meta: { successMessage: 'Хорошо' },
  });
};

/** Исправление отметки дня в пределах недели */
export const useFixDay = () => {
  const db = useDb();
  return useLocalMutation({
    mutationFn: async ({ dayId, status }: { dayId: number; status: DayFixDto['status'] }) => fixDay(db(), dayId, status),
    meta: { successMessage: 'Отметку исправил' },
  });
};

/**
 * Пауза видна и в профиле, и в дне — после правки перечитываем оба сразу,
 * не дожидаясь перечитывания по событию базы (SyncRunner)
 */
const refreshPauseScreens = () => {
  void queryClient.invalidateQueries({ queryKey: [LOCAL_ROOT, 'db', 'profile'] });
  void queryClient.invalidateQueries({ queryKey: [LOCAL_ROOT, 'db', 'day'] });
};

/** Пауза «до даты» (ГГГГ-ММ-ДД) или «до отмены» (null): бот молчит, серия не сгорает */
export const useStartPause = () => {
  const db = useDb();
  return useLocalMutation({
    mutationFn: async (endDate: string | null) => startPause(db(), endDate),
    onSuccess: refreshPauseScreens,
    meta: { successMessage: 'Пауза поставлена. Бот замолчит до её конца' },
  });
};

/** Снять паузу досрочно или вернуться после её срока */
export const useEndPause = () => {
  const db = useDb();
  return useLocalMutation({
    mutationFn: async () => endPause(db()),
    onSuccess: refreshPauseScreens,
    meta: { successMessage: 'Паузу снял. Бот снова будет спрашивать про тренировки' },
  });
};
