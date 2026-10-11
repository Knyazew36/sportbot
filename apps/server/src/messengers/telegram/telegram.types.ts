import {
  CanActivate,
  DynamicModule,
  ForwardReference,
  Type,
} from '@nestjs/common';

import type { TelegramAppAdapter } from './telegram-app.adapter';

/** Пользователь Telegram из подписанного initData мини-приложения или из апдейта бота. */
export interface TelegramUserInfo {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string | null;
  language_code?: string;
  photo_url?: string | null;
  is_premium?: boolean;
}

/** Результат входа через Telegram в браузере: то, что фронт кладёт себе как сессию. */
export interface TelegramWebSession {
  accessToken: string;
  user: { id: number; email: string | null };
}

/** Кнопка-ссылка в приветственном сообщении бота. */
export interface TelegramLinkButton {
  text: string;
  url: string;
}

export interface TelegramIntegrationOptions {
  /** Токен бота от @BotFather. */
  token: string;
  /** Имя бота без @ (как в ссылке https://t.me/<botName>). Из него строятся диплинки входа/привязки. */
  botName: string;
  /**
   * URL мини-приложения для кнопки «Открыть приложение» (web_app-кнопка, только https).
   * В проекте берётся из FRONTEND_URL (см. messengers/app-messengers.ts). Не задан — кнопка
   * ведёт на https://t.me/<botName>?startapp: откроется Main Mini App, если он настроен в @BotFather.
   */
  webAppUrl?: string;
  /** Сколько секунд initData мини-приложения считается свежим. Не задано — TELEGRAM_INIT_DATA_TTL_SECONDS (сутки). */
  initDataTtlSeconds?: number;
  /** Класс проекта с логикой, которую модуль не может знать сам (см. TelegramAppAdapter). */
  adapter: Type<TelegramAppAdapter>;
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
