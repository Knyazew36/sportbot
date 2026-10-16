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

/** Счёт в звёздах Telegram (валюта XTR) — для WebApp.openInvoice в мини-приложении. */
export interface TelegramStarsInvoice {
  /** Название товара, 1–32 символа */
  title: string;
  /** Описание, 1–255 символов */
  description: string;
  /** Внутренний идентификатор платежа, до 128 байт: вернётся в pre_checkout_query и successful_payment */
  payload: string;
  /** Сумма в звёздах */
  amount: number;
}

/** Запрос подтверждения перед списанием: ответить нужно за 10 секунд. */
export interface TelegramPreCheckout {
  telegramId: number;
  payload: string;
  currency: string;
  amount: number;
}

/** Ответ на pre_checkout_query: error — текст, который Telegram покажет пользователю. */
export type TelegramPreCheckoutResult = { ok: true } | { ok: false; error: string };

/** Оплата прошла. chargeId — telegram_payment_charge_id, по нему делается возврат. */
export interface TelegramSuccessfulPayment {
  telegramId: number;
  payload: string;
  currency: string;
  amount: number;
  chargeId: string;
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
