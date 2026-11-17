import type { CanActivate, DynamicModule, ForwardReference, Type } from '@nestjs/common'

import type { SupportFileStorage, SupportIdentity, SupportNotifier, SupportStore } from './ports'

export interface SupportChatModuleOptions {
  /** Пространство чата: один бэкенд может обслуживать несколько сайтов. В простом проекте — константа. */
  workspaceKey: string
  /** Секрет подписи токенов визита (не короче 32 символов). */
  secret: string
  /**
   * Секрет подписи пользователя для виджета на чужом сайте: сайт на своём бэке считает
   * userHash = HMAC-SHA256(identitySecret, userId) в hex. Не задан — такой вход выключен.
   */
  identitySecret?: string
  /** Срок жизни токена визита, по умолчанию 30 дней. */
  visitTokenTtlMs?: number
  /** Origin'ы, с которых можно подключаться к сокету. Не задано — любые (авторизация всё равно по токену). */
  allowedOrigins?: (origin: string) => boolean

  store: Type<SupportStore>
  identity: Type<SupportIdentity>
  files: Type<SupportFileStorage>
  notifier?: Type<SupportNotifier>
  /** Guard проекта, кладущий пользователя в req.user, — им закрыты эндпоинты операторов. */
  authGuard: Type<CanActivate>
  /** Модули, из которых реализации портов берут зависимости, если те не глобальные. */
  imports?: Array<Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference>
}

export type SupportChatResolvedOptions = Required<
  Pick<SupportChatModuleOptions, 'workspaceKey' | 'secret' | 'visitTokenTtlMs'>
> &
  Pick<SupportChatModuleOptions, 'identitySecret' | 'allowedOrigins'>
