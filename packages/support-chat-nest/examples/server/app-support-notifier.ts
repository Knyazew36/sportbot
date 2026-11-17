import {
  SupportNotifier,
  type SupportConversationRecord,
  type SupportMessageRecord,
} from '@app/support-chat-nest';
import { Injectable, Logger } from '@nestjs/common';

const PREVIEW_LENGTH = 300;
const QUOTE_LENGTH = 80;

/**
 * Необязательный порт: оповещения вне чата. Модуль вызывает их сам и ошибки только логирует —
 * упавшее оповещение не ломает отправку сообщения.
 *
 * notifyOperators — новое сообщение клиента в диалоге, где у операторов ещё не было непрочитанного.
 * notifyContact — ответ оператора, а клиента нет онлайн.
 *
 * Образец только пишет в лог. ЗАМЕНИТЬ send() на канал проекта: почта, Telegram, push. Кому писать —
 * решает проект: операторам — своим админам, клиенту — по contact.externalUserId (id пользователя проекта;
 * у анонима его нет, ему вне чата написать некуда).
 */
@Injectable()
export class AppSupportNotifier extends SupportNotifier {
  private readonly logger = new Logger(`🎧 ${AppSupportNotifier.name}`);

  // ── Оповещения ─────────────────────────────────────────────────────────────

  public async notifyOperators(
    conversation: SupportConversationRecord,
    message: SupportMessageRecord,
  ): Promise<void> {
    await this.send(
      'operators',
      [`🎧 Новое сообщение в поддержку, диалог #${conversation.id}`, this.preview(message)].join('\n'),
    );
  }

  public async notifyContact(
    conversation: SupportConversationRecord,
    message: SupportMessageRecord,
  ): Promise<void> {
    // Без имени оператора — клиент и в чате видит просто «Оператор»
    await this.send(
      `contact:${conversation.contactId}`,
      ['💬 Поддержка ответила:', this.preview(message)].join('\n'),
    );
  }

  // ── Внутреннее ─────────────────────────────────────────────────────────────

  // ЗАМЕНИТЬ: реальная доставка
  private async send(to: string, text: string): Promise<void> {
    this.logger.log(`Оповещение ${to}: ${text.split('\n')[0]}`);
  }

  private preview(message: SupportMessageRecord): string {
    const files = message.attachments.length
      ? `📎 Вложений: ${message.attachments.length}`
      : '';
    return [this.quote(message), this.cut(message.text, PREVIEW_LENGTH), files]
      .filter(Boolean)
      .join('\n');
  }

  /** Вне чата нет ленты — на что ответили, показываем строкой над текстом. */
  private quote(message: SupportMessageRecord): string {
    const reply = message.replyTo;
    if (!reply) return '';
    const source = reply.deletedAt
      ? 'сообщение удалено'
      : reply.text || (reply.attachmentsCount ? 'фото' : '');
    return `↩️ В ответ на «${this.cut(source, QUOTE_LENGTH)}»`;
  }

  private cut(text: string, max: number): string {
    return text.length > max ? `${text.slice(0, max)}…` : text;
  }
}
