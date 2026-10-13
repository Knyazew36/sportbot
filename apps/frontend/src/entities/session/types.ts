import type { ISODateString } from '@/shared/api'

/** Роль участника организации (enum OrgRole сервера) */
export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export const ORG_ROLE_LABEL: Record<OrgRole, string> = {
  OWNER: 'Владелец',
  ADMIN: 'Администратор',
  MEMBER: 'Участник',
}

export interface UserCapabilities {
  isPlatformAdmin: boolean
  isOrgOwner: boolean
  /** OWNER или ADMIN хотя бы в одной организации */
  isOrgAdmin: boolean
  isOrgMember: boolean
}

/** Организация пользователя из GET /user/me — для переключателя рабочих областей */
export interface MeOrganization {
  id: number
  name: string
  role: OrgRole
}

/** GET /user/me */
export interface Me {
  id: number
  email: string | null
  emailVerified: boolean
  name: string | null
  lastName: string | null
  avatarUrl: string | null
  phone: string | null
  vkId: string | null
  telegramId: string | null
  maxId: string | null
  createdAt: ISODateString
  capabilities: UserCapabilities
  organizations: MeOrganization[]
}

/** Ответ login / verify-email / change-password: токен сессии */
export interface AuthResponse {
  accessToken: string
  user: { id: number; email: string | null }
  message?: string
}

export interface MessageResponse {
  message: string
}

export interface LoginBody {
  email: string
  password: string
}

export interface RegisterBody extends LoginBody {
  name?: string
  lastName?: string
}

export interface RegisterResponse {
  email: string
  message: string
  /** false — аккаунт создан, но письмо с кодом не ушло: код нужно запросить повторно */
  emailSent: boolean
}

export interface VerifyEmailBody {
  email: string
  code: string
}

export interface ResetPasswordBody extends VerifyEmailBody {
  newPassword: string
}

export interface ChangePasswordBody {
  /** Обязателен, если пароль уже задан (у вошедших через мессенджер его может не быть) */
  currentPassword?: string
  newPassword: string
}

export interface DeleteAccountBody {
  /** Слово «удалить» */
  confirmation: string
  currentPassword?: string
}

export interface UpdateProfileBody {
  name?: string
  lastName?: string
  phone?: string
}
