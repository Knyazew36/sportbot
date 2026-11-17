import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit, Optional } from '@nestjs/common'
import type { Subscription } from 'rxjs'

import { SupportNotifier } from '../ports'
import { SupportEvents } from '../services/support-events'
import { SUPPORT_LOG_EMOJI } from '../support-chat.constants'

import { SupportChatGateway } from './support-chat.gateway'

/**
 * Оповещения вне чата. Шлём только на первое непрочитанное — иначе каждое сообщение переписки
 * превращается в пуш. Клиенту — только если у него нет открытой вкладки с чатом.
 */
@Injectable()
export class SupportNotifyListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(`${SUPPORT_LOG_EMOJI} ${SupportNotifyListener.name}`)
  private subscription?: Subscription

  constructor(
    private readonly events: SupportEvents,
    private readonly gateway: SupportChatGateway,
    @Optional() private readonly notifier?: SupportNotifier,
  ) {}

  // ── Жизненный цикл ─────────────────────────────────────────────────────────

  public onModuleInit(): void {
    if (!this.notifier) {
      this.logger.warn('SupportNotifier не передан — оповещения вне чата выключены')
      return
    }
    const notifier = this.notifier

    this.subscription = this.events.stream.subscribe(event => {
      if (event.type !== 'message.created' || event.message.isInternalNote) return
      const { conversation, message } = event

      if (message.author === 'CONTACT' && conversation.unreadForOperator === 1) {
        this.run(`операторам conversationId=${conversation.id}`, () => notifier.notifyOperators(conversation, message))
      }

      if (message.author === 'OPERATOR' && conversation.unreadForContact === 1) {
        this.run(`клиенту contactId=${conversation.contactId} conversationId=${conversation.id}`, async () => {
          if (await this.gateway.isContactOnline(conversation.contactId)) return
          await notifier.notifyContact(conversation, message)
        })
      }
    })
  }

  public onModuleDestroy(): void {
    this.subscription?.unsubscribe()
  }

  // ── Внутреннее ─────────────────────────────────────────────────────────────

  private run(target: string, action: () => Promise<void>): void {
    action().catch(error =>
      this.logger.error(`Не удалось отправить оповещение ${target}`, error instanceof Error ? error.stack : error),
    )
  }
}
