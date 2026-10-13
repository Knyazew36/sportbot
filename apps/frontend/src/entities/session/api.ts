import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { clearAccessToken, http, setAccessToken } from '@/shared/api'
import { useIsAuthenticated } from '@/shared/auth'

import type {
  AuthResponse,
  ChangePasswordBody,
  DeleteAccountBody,
  LoginBody,
  Me,
  MessageResponse,
  RegisterBody,
  RegisterResponse,
  ResetPasswordBody,
  UpdateProfileBody,
  VerifyEmailBody,
} from './types'

export const sessionKeys = {
  me: ['me'] as const,
}

// ── Сессия ──────────────────────────────────────────────────────────────────

/** Профиль текущего пользователя. Без токена запрос не уходит */
export const useMe = () => {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    queryKey: sessionKeys.me,
    queryFn: () => http.get<Me>('/user/me'),
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  })
}

/** Выход: гварды уводят на вход, кеш запросов чистится по событию сессии (shared/api/query-client) */
export const logout = (): void => clearAccessToken()

// ── Вход и регистрация ──────────────────────────────────────────────────────

export const useLogin = () =>
  useMutation({
    mutationFn: ({ remember = true, ...body }: LoginBody & { remember?: boolean }) =>
      http.post<AuthResponse>('/auth/login', body).then(response => ({ response, remember })),
    onSuccess: ({ response, remember }) => setAccessToken(response.accessToken, remember),
  })

export const useRegister = () =>
  useMutation({ mutationFn: (body: RegisterBody) => http.post<RegisterResponse>('/auth/register', body) })

/** Подтверждение почты — единственный момент выдачи токена новому аккаунту */
export const useVerifyEmail = () =>
  useMutation({
    mutationFn: (body: VerifyEmailBody) => http.post<AuthResponse>('/auth/verify-email', body),
    onSuccess: response => setAccessToken(response.accessToken),
  })

export const useResendVerification = () =>
  useMutation({
    mutationFn: (email: string) => http.post<MessageResponse>('/auth/resend-verification', { email }),
  })

export const useForgotPassword = () =>
  useMutation({
    mutationFn: (email: string) => http.post<MessageResponse>('/auth/forgot-password', { email }),
  })

export const useResetPassword = () =>
  useMutation({
    mutationFn: (body: ResetPasswordBody) => http.post<MessageResponse>('/auth/reset-password', body),
  })

// ── Свой профиль ────────────────────────────────────────────────────────────

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateProfileBody) => http.post<Me>('/user/me/update', body),
    onSuccess: me => queryClient.setQueryData(sessionKeys.me, me),
  })
}

export const useUploadAvatar = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => http.upload<Me>('/user/me/avatar', file),
    onSuccess: me => queryClient.setQueryData(sessionKeys.me, me),
  })
}

export const useChangePassword = () =>
  useMutation({
    mutationFn: (body: ChangePasswordBody) => http.post<AuthResponse>('/auth/change-password', body),
    // Прежние токены сервер отзывает — подменяем текущий на новый, иначе следующий запрос разлогинит
    onSuccess: response => setAccessToken(response.accessToken),
  })

export const useDeleteAccount = () =>
  useMutation({
    mutationFn: (body: DeleteAccountBody) => http.post<MessageResponse>('/auth/delete-account', body),
    onSuccess: logout,
  })
