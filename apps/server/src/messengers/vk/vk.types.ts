import {
  CanActivate,
  DynamicModule,
  ForwardReference,
  Type,
} from '@nestjs/common';

import type { VkAppAdapter } from './vk-app.adapter';

/**
 * Пользователь VK: из подписанных launch-параметров мини-приложения, профиля VK Bridge
 * (VKWebAppGetUserInfo) или users.get в боте.
 */
export interface VkUserInfo {
  id: number;
  first_name?: string;
  last_name?: string;
  screen_name?: string | null;
  photo_200?: string | null;
}

/** Результат входа через VK в браузере: то, что фронт кладёт себе как сессию. */
export interface VkWebSession {
  accessToken: string;
  user: { id: number; email: string | null };
}

/** Кнопка-ссылка в приветственном сообщении бота. */
export interface VkLinkButton {
  text: string;
  url: string;
}

/** Кнопка клавиатуры VK (https://dev.vk.com/ru/api/bots/development/keyboard). */
export type VkKeyboardButton =
  | {
      action: { type: 'callback'; label: string; payload: string };
      color?: 'primary' | 'secondary' | 'positive' | 'negative';
    }
  | { action: { type: 'open_link'; label: string; link: string } }
  | {
      action: {
        type: 'open_app';
        label: string;
        app_id: number;
        owner_id?: number;
        hash?: string;
      };
    };

/** Клавиатура сообщения VK. Модуль шлёт только inline-клавиатуры — они привязаны к сообщению, как у Telegram. */
export interface VkKeyboard {
  inline: true;
  buttons: VkKeyboardButton[][];
}

/** Входящее сообщение пользователя сообществу — то, что получает VkAppAdapter.onMessage. */
export interface VkMessageContext {
  vkId: number;
  peerId: number;
  text: string;
  /** Ответить в тот же чат. */
  reply(text: string, keyboard?: VkKeyboard): Promise<void>;
}

/** Нажатие callback-кнопки (событие message_event) — то, что получает VkAppAdapter.onCallback. */
export interface VkCallbackContext {
  vkId: number;
  peerId: number;
  /** id сообщения с кнопкой внутри диалога — по нему сообщение правится (messages.edit). */
  conversationMessageId: number;
  /** Строка из payload кнопки (поле `p`). */
  payload: string;
  /** Ответ на нажатие — всплывающая подсказка у пользователя. VK ждёт ответ, иначе кнопка «крутится». */
  answer(snackbarText?: string): Promise<void>;
  /** Заменить сообщение с кнопкой; не удалось (старое сообщение) — модуль отправит новое. */
  replaceMessage(text: string, keyboard?: VkKeyboard): Promise<void>;
  reply(text: string, keyboard?: VkKeyboard): Promise<void>;
}

export interface VkIntegrationOptions {
  /** Ключ доступа сообщества с правами «Сообщения сообщества» и «Управление сообществом» (для Long Poll). */
  token: string;
  /** id сообщества (положительное число). Из него строятся диплинки https://vk.me/club<groupId>. */
  groupId: number;
  /**
   * id мини-приложения VK. Задан — кнопка «Открыть приложение» открывает его прямо в VK (open_app),
   * иначе ведёт на webAppUrl обычной ссылкой.
   */
  appId?: number;
  /**
   * Защищённый ключ мини-приложения — им проверяется подпись launch-параметров. Не задан — авторизация
   * из мини-приложения VK выключена, бот, вход и уведомления работают.
   */
  appSecret?: string;
  /** URL веб-версии для кнопки «Открыть приложение», если appId не задан. */
  webAppUrl?: string;
  /** Сколько секунд launch-параметры считаются свежими. Не задано — VK_LAUNCH_PARAMS_TTL_SECONDS (сутки). */
  launchParamsTtlSeconds?: number;
  /** Класс проекта с логикой, которую модуль не может знать сам (см. VkAppAdapter). */
  adapter: Type<VkAppAdapter>;
  /**
   * Guard проекта, проверяющий обычную сессию (JWT и т.п.) и кладущий пользователя в req.user.
   * Им закрыты эндпоинты привязки и сверки разрешения на сообщения — модулю нужен текущий пользователь.
   */
  authGuard: Type<CanActivate>;
  /** Модули, из которых адаптер берёт свои зависимости (UserService, JwtService и т.п.). */
  imports?: Array<
    Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >;
}
