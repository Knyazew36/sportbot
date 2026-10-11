import {
  CanActivate,
  DynamicModule,
  ForwardReference,
  Type,
} from '@nestjs/common';

import type { MaxAppAdapter } from './max-app.adapter';

/** Пользователь MAX из подписанного initData мини-приложения или из апдейта бота. */
export interface MaxUserInfo {
  id: number;
  first_name?: string;
  last_name?: string;
  /** В апдейтах бота MAX отдаёт одно поле name вместо first_name/last_name. */
  name?: string;
  username?: string | null;
  language_code?: string;
  photo_url?: string | null;
}

/** Результат входа через MAX в браузере: то, что фронт кладёт себе как сессию. */
export interface MaxWebSession {
  accessToken: string;
  user: { id: number; email: string | null };
}

/** Кнопка-ссылка в приветственном сообщении бота. */
export interface MaxLinkButton {
  text: string;
  url: string;
}

export interface MaxIntegrationOptions {
  /** Токен бота из кабинета MAX для партнёров. */
  token: string;
  /**
   * Имя бота без @ (как в ссылке https://max.ru/<botName>). Из него строятся диплинки
   * входа/привязки и кнопки «Открыть приложение».
   */
  botName: string;
  /** Сколько секунд initData мини-приложения считается свежим. Не задано — модуль берёт MAX_AUTH_TTL_SECONDS из env, иначе сутки. */
  initDataTtlSeconds?: number;
  /** Класс проекта с логикой, которую модуль не может знать сам (см. MaxAppAdapter). */
  adapter: Type<MaxAppAdapter>;
  /**
   * Guard проекта, проверяющий обычную сессию (JWT и т.п.) и кладущий пользователя в req.user.
   * Им закрыт эндпоинт старта привязки — модулю нужен id текущего пользователя.
   */
  authGuard: Type<CanActivate>;
  /** Модули, из которых адаптер берёт свои зависимости (UserService, JwtService и т.п.). */
  imports?: Array<
    Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >;
}
