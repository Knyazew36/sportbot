import { useMutation } from '@tanstack/react-query';

import type { Profile } from '@sportbot/api/entities/profile';
import type { UpdateProfileDto } from '@sportbot/api/generated/model';
import { limitationControllerList } from '@sportbot/api/generated/limitation/limitation';
import { profileControllerView } from '@sportbot/api/generated/profile/profile';
import { stretchExclusionControllerList } from '@sportbot/api/generated/stretch-exclusion/stretch-exclusion';
import { CITY_ZONES } from '@sportbot/api/lib/timezone';

import { queryClient } from '@/shared/api/query-client';
import { type LocalDb, useLocalDb } from '@/shared/db';

import { LOCAL_ROOT, useLocalQuery } from '../../local-query';
import { readLimitations, readStretchExclusions } from './read-lists';
import { readProfile } from './read-profile';
import {
  addBodyWeight,
  createLimitation,
  createStretchExclusion,
  deleteLimitation,
  deleteStretchExclusion,
  setTimezone,
  updateProfile,
} from './write-profile';

// Настройки на базе телефона: правка видна сразу, на сервер уходит синком

const useDb = () => {
  const db = useLocalDb();
  return (): LocalDb => {
    if (!db) throw new Error('База на телефоне ещё открывается — повторите через секунду');
    return db;
  };
};

/** Профиль после правки — ответом мутации, как раньше от сервера */
const profileOf = (db: LocalDb): Profile => {
  const profile = readProfile(db);
  if (!profile) throw new Error('Профиль ещё не загружен');
  return profile;
};

/**
 * Правка — сразу в кэш запроса: экран обновляется ответом мутации, не дожидаясь
 * перечитывания по событию базы (SyncRunner): свичи и сегменты не дёргаются
 */
const PROFILE_KEY = [LOCAL_ROOT, 'db', 'profile'] as const;
const applyProfile = (profile: Profile) => queryClient.setQueryData(PROFILE_KEY, profile);
const refreshLocal = (key: string) => void queryClient.invalidateQueries({ queryKey: [LOCAL_ROOT, 'db', key] });

/** Настройки пользователя из локальной базы: расписание, таймеры, пауза, последний вес */
export const useProfile = () =>
  useLocalQuery({ key: ['profile'], read: readProfile, fallback: () => profileControllerView() });

/** Города России с поясами — список в приложении, сеть не нужна */
export const useCities = () =>
  useLocalQuery({ key: ['profile', 'cities'], read: () => CITY_ZONES, fallback: async () => CITY_ZONES });

export const useUpdateProfile = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (body: UpdateProfileDto) => {
      updateProfile(db(), body);
      return profileOf(db());
    },
    onSuccess: applyProfile,
    meta: { successMessage: 'Сохранил' },
  });
};

export const useSetTimezone = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (body: { zone?: string; localTime?: string }) => {
      setTimezone(db(), body);
      return profileOf(db());
    },
    onSuccess: applyProfile,
    meta: { successMessage: 'Часовой пояс сохранён' },
  });
};

export const useAddBodyWeight = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (value: number) => addBodyWeight(db(), value),
    // Вес входит в профиль (lastBodyWeight) и в график (stats body-weight) — обновляем оба
    onSuccess: () => {
      refreshLocal('profile');
      refreshLocal('stats');
    },
    meta: { successMessage: 'Вес записан' },
  });
};

/** Действующие ограничения по суставам: подсветка ⚠️ в комплексе и карточке упражнения */
export const useLimitations = () =>
  useLocalQuery({ key: ['limitation', 'list'], read: readLimitations, fallback: () => limitationControllerList() });

export const useCreateLimitation = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (body: { jointId: number; endDate?: string | null }) => createLimitation(db(), body),
    onSuccess: () => refreshLocal('limitation'),
    meta: { successMessage: 'Ограничение добавлено' },
  });
};

export const useDeleteLimitation = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (id: number) => deleteLimitation(db(), id),
    onSuccess: () => refreshLocal('limitation'),
    meta: { successMessage: 'Ограничение снято' },
  });
};

/** Растяжки, которые заминка не предлагает */
export const useStretchExclusions = () =>
  useLocalQuery({
    key: ['stretch-exclusion', 'list'],
    read: readStretchExclusions,
    fallback: () => stretchExclusionControllerList(),
  });

/** Исключена ли растяжка; пока список грузится — нет */
export const useIsStretchExcluded = (stretchId: number) => {
  const { data } = useStretchExclusions();
  return data?.some((e) => e.stretchId === stretchId) ?? false;
};

export const useCreateStretchExclusion = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (stretchId: number) => createStretchExclusion(db(), stretchId),
    onSuccess: () => refreshLocal('stretch-exclusion'),
    meta: { successMessage: 'Больше не предложим в заминке' },
  });
};

export const useDeleteStretchExclusion = () => {
  const db = useDb();
  return useMutation({
    mutationFn: async (stretchId: number) => deleteStretchExclusion(db(), stretchId),
    onSuccess: () => refreshLocal('stretch-exclusion'),
    meta: { successMessage: 'Растяжка снова в заминке' },
  });
};
