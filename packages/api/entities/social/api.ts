import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { programKeys } from '../program'
import type { FriendProfileResponseDto, FriendResponseDto } from '../../generated/model'
import {
  socialControllerCopyProgram,
  socialControllerFriend,
  socialControllerFriends,
  socialControllerInvite,
  socialControllerUnfriend,
} from '../../generated/social/social'

export type Friend = FriendResponseDto
export type FriendProfile = FriendProfileResponseDto

export const socialKeys = {
  all: ['social'] as const,
  friends: ['social', 'friends'] as const,
  friend: (id: number) => ['social', 'friend', id] as const,
}

/** Друзья: имя, серия, тренировался ли сегодня */
export const useFriends = () =>
  useQuery({
    queryKey: socialKeys.friends,
    queryFn: () => socialControllerFriends(),
    // Друзья на «Сегодня»: после перезапуска экран показывает сохранённых, а не ждёт сервер
    meta: { persist: true },
  })

/** Профиль друга: серия, пауза, программы. Статистика — отдельными запросами с его userId */
export const useFriend = (id: number) =>
  useQuery({
    queryKey: socialKeys.friend(id),
    queryFn: () => socialControllerFriend(id),
  })

/** Ссылка-приглашение на бота для «Поделиться» */
export const useCreateInvite = () =>
  useMutation({
    mutationFn: () => socialControllerInvite(),
    // Дальше открывается системное «Поделиться» — оно и есть результат
    meta: { skipSuccessToast: true },
  })

/** Разрыв дружбы: второй стороне уведомление не приходит */
export const useUnfriend = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => socialControllerUnfriend(id),
    meta: { successMessage: 'Удалил из друзей' },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: socialKeys.friend(id) })
      void queryClient.invalidateQueries({ queryKey: socialKeys.friends })
    },
  })
}

/** «Скопировать себе» программу друга */
export const useCopyFriendProgram = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (programId: number) => socialControllerCopyProgram(programId),
    meta: { successMessage: 'Программа у тебя в списке' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: programKeys.list }),
  })
}
