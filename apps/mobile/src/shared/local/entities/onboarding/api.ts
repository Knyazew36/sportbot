import type { OnboardingState } from '@sportbot/api/entities/onboarding';
import type { OnboardingDaysDto, OnboardingGenderDto, OnboardingTimesDto } from '@sportbot/api/generated/model';
import { onboardingControllerState } from '@sportbot/api/generated/onboarding/onboarding';

import { queryClient } from '@/shared/api/query-client';
import { type LocalDb, useLocalDb } from '@/shared/db';

import { useLocalMutation } from '../../local-mutation';
import { LOCAL_ROOT, useLocalQuery } from '../../local-query';
import { readOnboarded, readOnboarding } from './read-onboarding';
import { finishOnboarding, type OnboardingFinishInput, saveDays, saveGender, saveTimes } from './write-onboarding';

// Первый запуск на базе телефона: шаги и программа без сети, на сервер — синком

const useDb = () => {
  const db = useLocalDb();
  return (): LocalDb => {
    if (!db) throw new Error('База на телефоне ещё открывается — повторите через секунду');
    return db;
  };
};

const STATE_KEY = [LOCAL_ROOT, 'db', 'onboarding', 'state'] as const;

/** Состояние после шага — ответом мутации и сразу в кэш: следующий шаг открывается без перечитывания */
const stateOf = (db: LocalDb): OnboardingState => {
  const state = readOnboarding(db);
  if (!state) throw new Error('Данные ещё не загружены — подключитесь к интернету');
  queryClient.setQueryData(STATE_KEY, state);
  return state;
};

/** Шаги, пол и шаблоны программ из базы телефона; до первого синка — с сервера */
export const useOnboarding = () =>
  useLocalQuery({ key: ['onboarding', 'state'], read: readOnboarding, fallback: () => onboardingControllerState() });

/** Настройка закончена на телефоне — гвард не ждёт, пока сервер узнает об этом из синка */
export const useOnboardedLocally = () =>
  useLocalQuery({ key: ['onboarding', 'done'], read: readOnboarded, fallback: async () => ({ done: null }) });

const useStep = <V>(save: (db: LocalDb, values: V) => void) => {
  const db = useDb();
  return useLocalMutation({
    mutationFn: async (values: V) => {
      save(db(), values);
      return stateOf(db());
    },
    // Результат виден сразу: открывается следующий шаг
    meta: { skipSuccessToast: true },
  });
};

export const useSaveOnboardingGender = () => useStep((db, values: OnboardingGenderDto) => saveGender(db, values));

export const useSaveOnboardingDays = () => useStep((db, values: OnboardingDaysDto) => saveDays(db, values));

export const useSaveOnboardingTimes = () => useStep((db, values: OnboardingTimesDto) => saveTimes(db, values));

/** Последний шаг: программа и конец настройки — гвард уводит на «Сегодня» */
export const useFinishOnboarding = () => {
  const db = useDb();
  return useLocalMutation({
    mutationFn: async (input: OnboardingFinishInput) => {
      finishOnboarding(db(), input);
      return stateOf(db());
    },
    meta: { successMessage: 'Настройка закончена' },
  });
};
