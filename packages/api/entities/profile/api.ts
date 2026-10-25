import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { NativeFile } from '../../client'
import { dayKeys } from '../day'
import { statsKeys } from '../stats'
import { bodyWeightControllerCreate } from '../../generated/body-weight/body-weight'
import type {
  AvatarFromMessengerDto,
  ProfileResponseDto,
  SetTimezoneDto,
  UpdateProfileDto,
} from '../../generated/model'
import {
  profileControllerAvatarFromMessenger,
  profileControllerCities,
  profileControllerRemoveAvatar,
  profileControllerSetTimezone,
  profileControllerUpdate,
  profileControllerUploadAvatar,
  profileControllerView,
} from '../../generated/profile/profile'

export type Profile = ProfileResponseDto

export const profileKeys = {
  profile: ['profile'] as const,
  cities: ['profile', 'cities'] as const,
}

/** Настройки пользователя: расписание, таймеры, пауза, последний вес */
export const useProfile = () =>
  useQuery({
    queryKey: profileKeys.profile,
    queryFn: () => profileControllerView(),
  })

/** Города России с поясами — выбор часового пояса, как в боте */
export const useCities = () =>
  useQuery({
    queryKey: profileKeys.cities,
    queryFn: () => profileControllerCities(),
    staleTime: Infinity,
  })

// Расписание и пауза меняют экран «Сегодня»: тренировочный ли день, спросит ли бот
const useApplyProfile = () => {
  const queryClient = useQueryClient()
  return (profile: Profile) => {
    queryClient.setQueryData(profileKeys.profile, profile)
    void queryClient.invalidateQueries({ queryKey: dayKeys.all })
  }
}

export const useUpdateProfile = () => {
  const apply = useApplyProfile()
  return useMutation({
    mutationFn: (body: UpdateProfileDto) => profileControllerUpdate(body),
    meta: { successMessage: 'Сохранил', inlineFieldErrors: true },
    onSuccess: apply,
  })
}

export const useSetTimezone = () => {
  const apply = useApplyProfile()
  return useMutation({
    mutationFn: (body: SetTimezoneDto) => profileControllerSetTimezone(body),
    meta: { successMessage: 'Часовой пояс сохранён', inlineFieldErrors: true },
    onSuccess: apply,
  })
}

// ── Фото профиля ────────────────────────────────────────────────────────────

// Фото «Сегодня» не меняет — в отличие от расписания, достаточно положить профиль в кэш
const useApplyAvatar = () => {
  const queryClient = useQueryClient()
  return (profile: Profile) => queryClient.setQueryData(profileKeys.profile, profile)
}

export const useUploadAvatar = () => {
  const apply = useApplyAvatar()
  return useMutation({
    // В мобилке файл — объект с uri: FormData RN принимает его вместо Blob
    mutationFn: (file: File | NativeFile) => profileControllerUploadAvatar({ file: file as Blob }),
    meta: { successMessage: 'Фото обновлено' },
    onSuccess: apply,
  })
}

export const useAvatarFromMessenger = () => {
  const apply = useApplyAvatar()
  return useMutation({
    mutationFn: (messenger: AvatarFromMessengerDto['messenger']) => profileControllerAvatarFromMessenger({ messenger }),
    meta: { successMessage: 'Фото взято из мессенджера' },
    onSuccess: apply,
  })
}

export const useRemoveAvatar = () => {
  const apply = useApplyAvatar()
  return useMutation({
    mutationFn: () => profileControllerRemoveAvatar(),
    meta: { successMessage: 'Фото удалено' },
    onSuccess: apply,
  })
}

// ── Вес тела ────────────────────────────────────────────────────────────────

export const useAddBodyWeight = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (value: number) => bodyWeightControllerCreate({ value }),
    meta: { successMessage: 'Вес записан', inlineFieldErrors: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.profile })
      void queryClient.invalidateQueries({ queryKey: statsKeys.all })
    },
  })
}
