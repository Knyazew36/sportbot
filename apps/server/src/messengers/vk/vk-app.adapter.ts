import type { MessengerUser } from '../messenger.types';
import {
  VkCallbackContext,
  VkLinkButton,
  VkMessageContext,
  VkUserInfo,
  VkWebSession,
} from './vk.types';

/**
 * Контракт между модулем VK и конкретным проектом.
 *
 * Модуль сам умеет: проверять launch-параметры мини-приложения, держать бота сообщества, вести
 * вход/привязку через диплинки, помнить, разрешил ли пользователь сообщения от сообщества. Но он не
 * знает, как в проекте выдаются сессии, как сливаются аккаунты и что делать с кнопками, которые
 * проект шлёт в своих сообщениях. Это проект реализует в своём классе-наследнике и передаёт
 * в VkIntegrationModule.forRoot. Зеркало TelegramAppAdapter / MaxAppAdapter.
 *
 * Обязательные методы — abstract, необязательные имеют поведение по умолчанию.
 */
export abstract class VkAppAdapter {
  // ── Обязательные ────────────────────────────────────────────────────────

  /**
   * Выдать веб-сессию пользователю, который подтвердил вход кнопкой в чате сообщества.
   * Вызывается один раз на подтверждение; результат забирает браузер поллингом статуса.
   */
  public abstract issueWebSession(user: MessengerUser): Promise<VkWebSession>;

  /**
   * Привязать VK-аккаунт к веб-аккаунту targetUserId. Пользователь уже подтвердил это кнопкой.
   *
   * @param existingUser пользователь, у которого этот vkId уже записан (например, заходил
   *   в мини-приложение раньше). Проект решает: слить его в target, отказать или что-то ещё.
   *   null — vkId свободен, достаточно записать его в target.
   * @returns итоговый пользователь, у которого теперь стоит vkId.
   * @throws Error с понятным пользователю текстом — модуль покажет его в чате.
   */
  public abstract linkAccount(params: {
    targetUserId: number;
    vkUser: VkUserInfo;
    existingUser: MessengerUser | null;
  }): Promise<MessengerUser>;

  /**
   * Как назвать веб-аккаунт в вопросе «Привязать VK к аккаунту …?» — обычно email.
   * Показ, к какому аккаунту идёт привязка, — защита от фишинга чужой ссылкой привязки.
   */
  public abstract describeAccount(userId: number): Promise<string | null>;

  // ── Необязательные ──────────────────────────────────────────────────────

  /** Текст приветствия бота (на «Начать» без ref и на любое сообщение). */
  public welcomeText(): string {
    return '👋 Добро пожаловать! Приложение открывается по кнопке ниже. Сюда же будут приходить уведомления — не запрещайте сообщения от сообщества.';
  }

  /** Дополнительные кнопки-ссылки в приветствии (сайт, веб-кабинет и т.п.). */
  public welcomeLinks(): VkLinkButton[] {
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
    _ctx: VkCallbackContext,
    _user: MessengerUser | null,
  ): Promise<boolean> {
    return false;
  }

  /**
   * Текстовое сообщение пользователя сообществу (например, ждём комментарий к опросу).
   * @returns true — обработано; false — модуль ответит приветствием.
   */

  public async onMessage(
    _ctx: VkMessageContext,
    _user: MessengerUser | null,
  ): Promise<boolean> {
    return false;
  }
}
