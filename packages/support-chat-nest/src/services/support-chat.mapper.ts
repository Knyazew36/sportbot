import { Injectable } from '@nestjs/common'

import type {
  SupportAttachmentDto,
  SupportContactDto,
  SupportConversationDto,
  SupportMessageDto,
  SupportMessageReplyDto,
} from '../dto'
import { SupportFileStorage } from '../ports'
import type {
  SupportContactRecord,
  SupportConversationRecord,
  SupportMessageRecord,
  SupportMessageReplyRecord,
} from '../support-chat.records'

/** Кому отдаём диалог: посетителю не показываем теги и счётчики операторов. */
export type SupportViewer = 'contact' | 'operator'

/** Цитате хватает начала: полный текст ответа удвоил бы размер ленты. */
const REPLY_TEXT_MAX = 200

@Injectable()
export class SupportChatMapper {
  constructor(private readonly files: SupportFileStorage) {}

  // ── Маппинг ────────────────────────────────────────────────────────────────

  public message(record: SupportMessageRecord): SupportMessageDto {
    const deleted = record.deletedAt !== null
    return {
      id: record.id,
      conversationId: record.conversationId,
      seq: record.seq,
      author: record.author,
      authorId: record.authorId,
      authorName: record.authorName,
      // У удалённого сообщения seq остаётся (иначе клиент увидит дыру), а содержимое — нет
      text: deleted ? '' : record.text,
      isInternalNote: record.isInternalNote,
      clientMessageId: record.clientMessageId,
      channel: record.channel,
      attachments: deleted ? [] : this.attachments(record),
      replyTo: deleted || !record.replyTo ? null : this.reply(record.replyTo),
      editedAt: record.editedAt?.toISOString() ?? null,
      deletedAt: record.deletedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
    }
  }

  public conversation(record: SupportConversationRecord, viewer: SupportViewer): SupportConversationDto {
    const forOperator = viewer === 'operator'
    const lastMessage =
      record.lastMessage === undefined
        ? undefined
        : record.lastMessage && (forOperator || !record.lastMessage.isInternalNote)
          ? this.message(record.lastMessage)
          : null

    return {
      id: record.id,
      status: record.status,
      contactId: record.contactId,
      assigneeId: record.assigneeId,
      assigneeName: record.assigneeName,
      sourceChannel: record.sourceChannel,
      lastSeq: record.lastSeq,
      lastMessageAt: record.lastMessageAt?.toISOString() ?? null,
      contactReadSeq: record.contactReadSeq,
      operatorReadSeq: record.operatorReadSeq,
      unreadForContact: record.unreadForContact,
      unreadForOperator: forOperator ? record.unreadForOperator : 0,
      tags: forOperator ? record.tags : [],
      rating: record.rating,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      ...(forOperator && record.contact ? { contact: this.contact(record.contact) } : {}),
      ...(lastMessage !== undefined ? { lastMessage } : {}),
    }
  }

  public contact(record: SupportContactRecord): SupportContactDto {
    return {
      id: record.id,
      externalUserId: record.externalUserId,
      name: record.name,
      email: record.email,
      phone: record.phone,
      createdAt: record.createdAt.toISOString(),
    }
  }

  // ── Внутреннее ─────────────────────────────────────────────────────────────

  private reply(record: SupportMessageReplyRecord): SupportMessageReplyDto {
    const deleted = record.deletedAt !== null
    return {
      id: record.id,
      seq: record.seq,
      author: record.author,
      authorName: record.authorName,
      text: deleted ? '' : record.text.slice(0, REPLY_TEXT_MAX),
      attachmentsCount: deleted ? 0 : record.attachmentsCount,
      deletedAt: record.deletedAt?.toISOString() ?? null,
    }
  }

  private attachments(record: SupportMessageRecord): SupportAttachmentDto[] {
    return record.attachments.flatMap(attachment => {
      const url = this.files.toPublicUrl(attachment.path)
      return url
        ? [{ id: attachment.id, url, name: attachment.name, mime: attachment.mime, size: attachment.size }]
        : []
    })
  }
}
