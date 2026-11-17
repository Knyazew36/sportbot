import type { SupportSide } from '@app/support-chat-core'
import { Injectable } from '@nestjs/common'
import { type Observable, Subject } from 'rxjs'

import type { SupportConversationRecord, SupportMessageRecord } from '../support-chat.records'

/** Доменные события чата. Сокет и оповещения подписываются на них, сервисы о них не знают. */
export type SupportEvent =
  | {
      type: 'message.created'
      conversation: SupportConversationRecord
      message: SupportMessageRecord
      /** Кнопки-действия от оператора: не хранятся, их забирают мосты в мессенджеры (ключи понимает проект). */
      actions?: string[]
    }
  | {
      type: 'message.updated' | 'message.deleted'
      contactId: number
      message: SupportMessageRecord
    }
  | { type: 'conversation.updated'; conversation: SupportConversationRecord }
  | { type: 'conversation.deleted'; conversation: SupportConversationRecord }
  | { type: 'conversation.read'; conversation: SupportConversationRecord; side: SupportSide; seq: number }

@Injectable()
export class SupportEvents {
  private readonly subject = new Subject<SupportEvent>()

  public readonly stream: Observable<SupportEvent> = this.subject.asObservable()

  // ── События ────────────────────────────────────────────────────────────────

  public emit(event: SupportEvent): void {
    this.subject.next(event)
  }
}
