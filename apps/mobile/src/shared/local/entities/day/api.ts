import { useMutation } from '@tanstack/react-query';

import type { DayFixDto } from '@sportbot/api/generated/model';
import { dayControllerToday } from '@sportbot/api/generated/day/day';

import { type LocalDb, useLocalDb } from '@/shared/db';

import { useLocalQuery } from '../../local-query';
import { readToday } from './read-today';
import { endPause, eveningAnswer, fixDay, pickComplex, rescheduleAnswer, skipDay, startPause } from './write-day';

// День и пауза на базе телефона: ответ пишется сразу, «Сегодня» перечитывается от изменения базы,
// сервер узнаёт синком (MutationCache зовёт requestSync после каждой мутации)

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
  return useMutation({
    mutationFn: async (complexId: number) => pickComplex(db(), complexId),
    // Новый комплекс сразу виден на экране дня
    meta: { skipSuccessToast: true },
  });
};

/** «Сегодня не буду» — как утреннее «нет» в боте */
export const useSkipDay = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async () => skipDay(db()),
    meta: { successMessage: 'Записал пропуск' },
  });
};

/** Вечерний ответ «потренировался сегодня?» */
export const useEveningAnswer = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (yes: boolean) => eveningAnswer(db(), yes),
    // Итог — засчитано или пропуск — сразу виден на экране дня
    meta: { skipSuccessToast: true },
  });
};

/** Ответ на «напомнить завтра?» */
export const useRescheduleAnswer = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (accept: boolean) => rescheduleAnswer(db(), accept),
    meta: { successMessage: 'Хорошо' },
  });
};

/** Исправление отметки дня в пределах недели */
export const useFixDay = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async ({ dayId, status }: { dayId: number; status: DayFixDto['status'] }) => fixDay(db(), dayId, status),
    meta: { successMessage: 'Отметку исправил' },
  });
};

/** Пауза «до даты» (ГГГГ-ММ-ДД) или «до отмены» (null): бот молчит, серия не сгорает */
export const useStartPause = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (endDate: string | null) => startPause(db(), endDate),
    meta: { successMessage: 'Пауза поставлена. Бот замолчит до её конца' },
  });
};

/** Снять паузу досрочно или вернуться после её срока */
export const useEndPause = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async () => endPause(db()),
    meta: { successMessage: 'Паузу снял. Бот снова будет спрашивать про тренировки' },
  });
};
