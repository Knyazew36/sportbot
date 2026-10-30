import { stretchRoutineControllerFind, stretchRoutineControllerList } from '@sportbot/api/generated/stretch-routine/stretch-routine';

import { type LocalDb, useLocalDb } from '@/shared/db';

import { useLocalMutation } from '../../local-mutation';
import { useLocalQuery } from '../../local-query';
import { readStretchRoutine, readStretchRoutines } from './read-stretch-routine';
import { finishStretchSession, startStretchSession } from './write-stretch-routine';

const useDb = () => {
  const db = useLocalDb();
  return (): LocalDb => {
    if (!db) throw new Error('База на телефоне ещё открывается — повторите через секунду');
    return db;
  };
};

export const useStretchRoutines = () =>
  useLocalQuery({
    key: ['stretch-routine', 'list'],
    read: readStretchRoutines,
    fallback: () => stretchRoutineControllerList(),
  });

export const useStretchRoutine = (id: number) =>
  useLocalQuery({
    key: ['stretch-routine', id],
    read: (db) => readStretchRoutine(db, id),
    fallback: () => stretchRoutineControllerFind(id),
  });

export const useStartStretchSession = () => {
  const db = useDb();
  return useLocalMutation({
    mutationFn: async (routineId: number) => startStretchSession(db(), routineId),
    // Занятие уже идёт на экране — отметка начала фоновая
    meta: { skipSuccessToast: true },
  });
};

export const useFinishStretchSession = () => {
  const db = useDb();
  return useLocalMutation({
    mutationFn: async (clientId: string) => finishStretchSession(db(), clientId),
    meta: { successMessage: 'Занятие записано' },
  });
};
