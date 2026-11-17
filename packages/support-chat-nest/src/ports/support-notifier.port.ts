import type { SupportConversationRecord, SupportMessageRecord } from '../support-chat.records'

/**
 * Оповещения вне чата (мессенджеры, почта). Необязательный порт: без него модуль только
 * пишет в сокет. Ошибки реализации модуль логирует и не пробрасывает.
 */
export abstract class SupportNotifier {
  /** Новое сообщение клиента в диалоге, где у операторов ещё не было непрочитанного. */
  public abstract notifyOperators(conversation: SupportConversationRecord, message: SupportMessageRecord): Promise<void>

  /** Ответ оператора, а клиента нет онлайн. */
  public abstract notifyContact(conversation: SupportConversationRecord, message: SupportMessageRecord): Promise<void>
}
