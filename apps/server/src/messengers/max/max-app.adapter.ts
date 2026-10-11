import type { Context } from 'max-io';

import type { MessengerUser } from '../messenger.types';
import { MaxLinkButton, MaxUserInfo, MaxWebSession } from './max.types';

/**
 * Контракт между модулем MAX и конкретным проектом.
 *
 * Модуль сам умеет: проверять initData, держать бота, вести вход/привязку через диплинки,
 * помнить, открыт ли чат с ботом. Но он не знает, как в проекте выдаются сессии, как
 * сливаются аккаунты и что делать с кнопками, которые проект шлёт в своих сообщениях.
 * Это проект реализует в своём классе-наследнике и передаёт в MaxIntegrationModule.forRoot.
 *
 * Обязательные методы — abstract, необязательные имеют поведение по умолчанию.
 */
export abstract class MaxAppAdapter {
  // ── Обязательные ────────────────────────────────────────────────────────

  /**
   * Выдать веб-сессию пользователю, который подтвердил вход кнопкой в чате бота.
   * Вызывается один раз на подтверждение; результат забирает браузер поллингом статуса.
   */
  public abstract issueWebSession(user: MessengerUser): Promise<MaxWebSession>;

  /**
   * Привязать MAX-аккаунт к веб-аккаунту targetUserId. Пользователь уже подтвердил это кнопкой.
   *
   * @param existingUser пользователь, у которого этот maxId уже записан (например, заходил
   *   в мини-приложение раньше). Проект решает: слить его в target, отказать или что-то ещё.
   *   null — maxId свободен, достаточно записать его в target.
   * @returns итоговый пользователь, у которого теперь стоит maxId.
   * @throws Error с понятным пользователю текстом — модуль покажет его в чате.
   */
  public abstract linkAccount(params: {
    targetUserId: number;
    maxUser: MaxUserInfo;
    existingUser: MessengerUser | null;
  }): Promise<MessengerUser>;

  /**
   * Как назвать веб-аккаунт в вопросе «Привязать MAX к аккаунту …?» — обычно email.
   * Показ, к какому аккаунту идёт привязка, — защита от фишинга чужой ссылкой привязки.
   */
  public abstract describeAccount(userId: number): Promise<string | null>;

  // ── Необязательные ──────────────────────────────────────────────────────

  /** Текст приветствия бота (на /start без payload и на любое сообщение). */
  public welcomeText(): string {
    return '👋 Добро пожаловать! Приложение открывается по кнопке ниже. Сюда же будут приходить уведомления — не удаляйте чат.';
  }

  /** Дополнительные кнопки-ссылки в приветствии (сайт, веб-кабинет и т.п.). */
  public welcomeLinks(): MaxLinkButton[] {
    return [];
  }

  /**
   * Callback-кнопки проекта в приветствии (по одной в ряд); нажатие придёт в onCallback с этим payload.
   * user — кому показываем (null — аккаунта ещё нет): кнопки могут зависеть от прав.
   */

  public welcomeCallbacks(
    _user: MessengerUser | null,
  ): { text: string; payload: string }[] {
    return [];
  }

  /**
   * Нажатие callback-кнопки, которую модуль не распознал (кнопки проекта: опросы и т.п.).
   * @returns true — обработано; false — модуль ответит, что кнопка устарела.
   */

  public async onCallback(
    _ctx: Context,
    _user: MessengerUser | null,
  ): Promise<boolean> {
    return false;
  }

  /**
   * Текстовое сообщение пользователя боту (например, ждём комментарий к опросу).
   * @returns true — обработано; false — модуль ответит приветствием.
   */

  public async onMessage(
    _ctx: Context,
    _user: MessengerUser | null,
  ): Promise<boolean> {
    return false;
  }
}
