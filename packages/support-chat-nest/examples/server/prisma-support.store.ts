import {
  SupportStore,
  type SupportAppendResult,
  type SupportContactInput,
  type SupportContactPatch,
  type SupportContactRecord,
  type SupportConversationInput,
  type SupportConversationListQuery,
  type SupportConversationPatch,
  type SupportConversationRecord,
  type SupportConversationScope,
  type SupportMessageEffects,
  type SupportMessageInput,
  type SupportMessageListQuery,
  type SupportMessageRecord,
  type SupportMessageScope,
  type SupportMessageWithContact,
  type SupportPage,
  type SupportSide,
} from '@app/support-chat-nest';
import { Injectable, Logger } from '@nestjs/common';

// ЗАМЕНИТЬ: путь к клиенту Prisma проекта (при своём output в generator — '<output>/client')
import { Prisma } from '@prisma/client';
// ЗАМЕНИТЬ: сервис Prisma проекта (обычно PrismaService extends PrismaClient)
import { PrismaService } from '../prisma/prisma.service';

const MESSAGE_INCLUDE = {
  attachments: { orderBy: { id: 'asc' } },
  replyTo: {
    select: {
      id: true,
      seq: true,
      author: true,
      authorName: true,
      text: true,
      isInternalNote: true,
      deletedAt: true,
      _count: { select: { attachments: true } },
    },
  },
} satisfies Prisma.SupportMessageInclude;

const MESSAGE_WITH_CONTACT_INCLUDE = {
  ...MESSAGE_INCLUDE,
  conversation: { select: { contactId: true } },
} satisfies Prisma.SupportMessageInclude;

type MessageRow = Prisma.SupportMessageGetPayload<{
  include: typeof MESSAGE_INCLUDE;
}>;
type MessageWithContactRow = Prisma.SupportMessageGetPayload<{
  include: typeof MESSAGE_WITH_CONTACT_INCLUDE;
}>;

/** Чьи сообщения считаются непрочитанными у стороны: служебные строки счётчик не трогают. */
const UNREAD_AUTHORS: Record<SupportSide, Prisma.SupportMessageWhereInput> = {
  CONTACT: { author: { in: ['OPERATOR', 'BOT'] }, isInternalNote: false },
  OPERATOR: { author: 'CONTACT' },
};

/**
 * SupportStore поверх Prisma. Модели — из prisma/support.prisma пакета @app/support-chat-nest.
 * Копируется в проект как есть; менять только импорты сверху.
 * «Не найдено» — null: ловим P2025 мутаций, а не проверяем отдельным запросом.
 */
@Injectable()
export class PrismaSupportStore extends SupportStore {
  private readonly logger = new Logger(
    `🎧 ${PrismaSupportStore.name}`,
  );

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // ── Контакты ───────────────────────────────────────────────────────────────

  public findContactByAnonymousKey(
    workspaceKey: string,
    anonymousKey: string,
  ): Promise<SupportContactRecord | null> {
    return this.prisma.supportContact.findFirst({
      where: { workspaceKey, anonymousKey },
    });
  }

  public upsertContactByExternalUserId(
    workspaceKey: string,
    externalUserId: string,
    patch: SupportContactPatch,
  ): Promise<SupportContactRecord> {
    return this.prisma.supportContact.upsert({
      where: { workspaceKey_externalUserId: { workspaceKey, externalUserId } },
      create: { workspaceKey, externalUserId, ...patch },
      // undefined Prisma пропускает — пустые поля формы не затирают известные данные
      update: patch,
    });
  }

  public createContact(
    input: SupportContactInput,
  ): Promise<SupportContactRecord> {
    return this.prisma.supportContact.create({ data: input });
  }

  public async updateContact(
    id: number,
    workspaceKey: string,
    patch: SupportContactPatch,
  ): Promise<SupportContactRecord | null> {
    return this.nullIfNotFound(() =>
      this.prisma.supportContact.update({
        where: { id, workspaceKey },
        data: patch,
      }),
    );
  }

  public async mergeContacts(fromId: number, intoId: number): Promise<void> {
    await this.prisma.$transaction([
      // Свои сообщения остаются своими — иначе после входа их нельзя будет править
      this.prisma.supportMessage.updateMany({
        where: {
          author: 'CONTACT',
          authorId: fromId,
          conversation: { contactId: fromId },
        },
        data: { authorId: intoId },
      }),
      this.prisma.supportConversation.updateMany({
        where: { contactId: fromId },
        data: { contactId: intoId },
      }),
      this.prisma.supportContact.delete({ where: { id: fromId } }),
    ]);
  }

  // ── Диалоги ────────────────────────────────────────────────────────────────

  public findConversation(
    id: number,
    scope: SupportConversationScope,
    options: { withContact?: boolean } = {},
  ): Promise<SupportConversationRecord | null> {
    return this.prisma.supportConversation.findFirst({
      where: { id, ...this.conversationWhere(scope) },
      include: { contact: options.withContact ?? false },
    }) as Promise<SupportConversationRecord | null>;
  }

  public findActiveConversation(
    contactId: number,
    workspaceKey: string,
  ): Promise<SupportConversationRecord | null> {
    return this.prisma.supportConversation.findFirst({
      where: { contactId, workspaceKey, status: { not: 'CLOSED' } },
      orderBy: { id: 'desc' },
    });
  }

  public async listConversations(
    query: SupportConversationListQuery,
  ): Promise<SupportPage<SupportConversationRecord>> {
    const where: Prisma.SupportConversationWhereInput = {
      workspaceKey: query.workspaceKey,
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(query.assigneeId !== undefined
        ? { assigneeId: query.assigneeId }
        : {}),
      ...(query.channel ? { sourceChannel: query.channel } : {}),
      ...(query.search
        ? {
            contact: {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search } },
              ],
            },
          }
        : {}),
    };

    const page = Math.max(1, query.page);
    const limit = Math.max(1, query.limit);
    const [total, rows] = await Promise.all([
      this.prisma.supportConversation.count({ where }),
      this.prisma.supportConversation.findMany({
        where,
        include: {
          contact: query.withContact,
          messages: query.withLastMessage
            ? { orderBy: { seq: 'desc' }, take: 1, include: MESSAGE_INCLUDE }
            : false,
        },
        orderBy: [
          { lastMessageAt: { sort: 'desc', nulls: 'last' } },
          { id: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const result = {
      items: rows,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    return {
      ...result,
      // include с условием Prisma не выводит — уточняем тип вручную
      items: (
        result.items as unknown as Array<
          SupportConversationRecord & { messages?: MessageRow[] }
        >
      ).map(({ messages, ...conversation }) => ({
        ...conversation,
        ...(query.withLastMessage
          ? {
              lastMessage: messages?.[0]
                ? this.messageRecord(messages[0])
                : null,
            }
          : {}),
      })),
    };
  }

  public async createConversation(
    input: SupportConversationInput,
  ): Promise<SupportConversationRecord | null> {
    // Контакт другого workspace в FK не отличить, поэтому проверяем его явно
    return this.prisma.$transaction(async (tx) => {
      const contact = await tx.supportContact.findFirst({
        where: { id: input.contactId, workspaceKey: input.workspaceKey },
        select: { id: true },
      });
      return contact ? tx.supportConversation.create({ data: input }) : null;
    });
  }

  public updateConversation(
    id: number,
    scope: SupportConversationScope,
    patch: SupportConversationPatch,
  ): Promise<SupportConversationRecord | null> {
    return this.nullIfNotFound(() =>
      this.prisma.supportConversation.update({
        where: { id, ...this.conversationWhere(scope) },
        data: patch,
      }),
    );
  }

  public deleteConversation(
    id: number,
    scope: SupportConversationScope,
  ): Promise<{
    conversation: SupportConversationRecord;
    attachmentPaths: string[];
  } | null> {
    return this.nullIfNotFound(() =>
      this.prisma.$transaction(async (tx) => {
        // Вложения удалятся каскадом — пути для удаления файлов читаем до этого
        const attachments = await tx.supportAttachment.findMany({
          where: {
            message: {
              conversationId: id,
              conversation: this.conversationWhere(scope),
            },
          },
          select: { path: true },
        });
        const conversation = await tx.supportConversation.delete({
          where: { id, ...this.conversationWhere(scope) },
        });
        return {
          conversation,
          attachmentPaths: attachments.map((item) => item.path),
        };
      }),
    );
  }

  public async markRead(
    conversationId: number,
    scope: SupportConversationScope,
    side: SupportSide,
    seq: number,
  ): Promise<SupportConversationRecord | null> {
    return this.prisma.$transaction(async (tx) => {
      const conversation = await tx.supportConversation.findFirst({
        where: { id: conversationId, ...this.conversationWhere(scope) },
      });
      if (!conversation) return null;

      const current =
        side === 'CONTACT'
          ? conversation.contactReadSeq
          : conversation.operatorReadSeq;
      // Назад не двигаем: вкладки присылают прочтения вразнобой
      const readSeq = Math.max(current, Math.min(seq, conversation.lastSeq));
      const unread = await tx.supportMessage.count({
        where: {
          conversationId,
          seq: { gt: readSeq },
          deletedAt: null,
          ...UNREAD_AUTHORS[side],
        },
      });

      return tx.supportConversation.update({
        where: { id: conversationId },
        data:
          side === 'CONTACT'
            ? { contactReadSeq: readSeq, unreadForContact: unread }
            : { operatorReadSeq: readSeq, unreadForOperator: unread },
      });
    });
  }

  // ── Сообщения ──────────────────────────────────────────────────────────────

  public async appendMessage(
    conversationId: number,
    scope: SupportConversationScope,
    input: SupportMessageInput,
    effects: SupportMessageEffects,
  ): Promise<SupportAppendResult | null> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // UPDATE … lastSeq + 1 берёт блокировку строки диалога: параллельные сообщения
        // получают seq строго по очереди
        const bumped = await tx.supportConversation.update({
          where: { id: conversationId, ...this.conversationWhere(scope) },
          data: {
            lastSeq: { increment: 1 },
            lastMessageAt: new Date(),
            ...(effects.status ? { status: effects.status } : {}),
            ...(effects.unreadFor === 'CONTACT'
              ? { unreadForContact: { increment: 1 } }
              : {}),
            ...(effects.unreadFor === 'OPERATOR'
              ? { unreadForOperator: { increment: 1 } }
              : {}),
          },
        });
        const seq = bumped.lastSeq;

        const assign =
          effects.assignIfUnassigned && bumped.assigneeId === null
            ? {
                assigneeId: effects.assignIfUnassigned.id,
                assigneeName: effects.assignIfUnassigned.name,
              }
            : {};
        const read =
          effects.readBy === 'CONTACT'
            ? { contactReadSeq: seq, unreadForContact: 0 }
            : effects.readBy === 'OPERATOR'
              ? { operatorReadSeq: seq, unreadForOperator: 0 }
              : {};
        const conversation =
          Object.keys(assign).length || Object.keys(read).length
            ? await tx.supportConversation.update({
                where: { id: conversationId },
                data: { ...assign, ...read },
              })
            : bumped;

        const { attachments, replyToId, ...fields } = input;
        const message = await tx.supportMessage.create({
          data: {
            ...fields,
            conversationId,
            seq,
            replyToId: replyToId
              ? await this.replyTarget(tx, conversationId, replyToId, input)
              : null,
            attachments: { create: attachments },
          },
          include: MESSAGE_INCLUDE,
        });
        return {
          conversation,
          message: this.messageRecord(message),
          created: true,
        };
      });
    } catch (error) {
      if (this.isPrismaError(error, 'P2025')) return null;
      if (this.isPrismaError(error, 'P2002') && input.clientMessageId) {
        return this.existingMessage(conversationId, input.clientMessageId);
      }
      throw error;
    }
  }

  public async listMessages(
    query: SupportMessageListQuery,
  ): Promise<{ items: SupportMessageRecord[]; hasMore: boolean }> {
    const forward = query.afterSeq !== undefined;
    const cursor = forward
      ? { seq: { gt: query.afterSeq } }
      : query.beforeSeq !== undefined
        ? { seq: { lt: query.beforeSeq } }
        : {};
    // На одну запись больше — так узнаём hasMore без отдельного count
    const rows = await this.prisma.supportMessage.findMany({
      where: {
        conversationId: query.conversationId,
        conversation: this.conversationWhere(query.scope),
        ...(query.includeInternal ? {} : { isInternalNote: false }),
        ...cursor,
      },
      include: MESSAGE_INCLUDE,
      // Вверх по истории — с конца, добор — с начала; отдаём всегда по возрастанию seq
      orderBy: { seq: forward ? 'asc' : 'desc' },
      take: query.limit + 1,
    });
    const page = rows.slice(0, query.limit);
    return {
      items: (forward ? page : page.reverse()).map((row) =>
        this.messageRecord(row),
      ),
      hasMore: rows.length > query.limit,
    };
  }

  public async findMessage(
    id: number,
    scope: SupportMessageScope,
  ): Promise<SupportMessageWithContact | null> {
    const row = await this.prisma.supportMessage.findFirst({
      where: { id, ...this.messageWhere(scope) },
      include: MESSAGE_WITH_CONTACT_INCLUDE,
    });
    return row ? this.withContact(row) : null;
  }

  public updateMessageText(
    id: number,
    scope: SupportMessageScope,
    text: string,
  ): Promise<SupportMessageWithContact | null> {
    return this.nullIfNotFound(async () =>
      this.withContact(
        await this.prisma.supportMessage.update({
          where: { id, deletedAt: null, ...this.messageWhere(scope) },
          data: { text, editedAt: new Date() },
          include: MESSAGE_WITH_CONTACT_INCLUDE,
        }),
      ),
    );
  }

  public softDeleteMessage(
    id: number,
    scope: SupportMessageScope,
  ): Promise<SupportMessageWithContact | null> {
    return this.nullIfNotFound(async () =>
      this.withContact(
        await this.prisma.supportMessage.update({
          where: { id, deletedAt: null, ...this.messageWhere(scope) },
          data: { deletedAt: new Date() },
          include: MESSAGE_WITH_CONTACT_INCLUDE,
        }),
      ),
    );
  }

  // ── Внутреннее ─────────────────────────────────────────────────────────────

  private conversationWhere(
    scope: SupportConversationScope,
  ): Omit<Prisma.SupportConversationWhereInput, 'id'> {
    return {
      workspaceKey: scope.workspaceKey,
      ...(scope.contactId !== undefined ? { contactId: scope.contactId } : {}),
    };
  }

  private messageWhere(
    scope: SupportMessageScope,
  ): Omit<Prisma.SupportMessageWhereInput, 'id'> {
    return {
      conversation: this.conversationWhere(scope),
      ...(scope.author ? { author: scope.author } : {}),
      ...(scope.authorId !== undefined ? { authorId: scope.authorId } : {}),
      ...(scope.createdAfter ? { createdAt: { gte: scope.createdAfter } } : {}),
      ...(scope.includeInternal ? {} : { isInternalNote: false }),
    };
  }

  /** Повтор запроса с тем же clientMessageId: отдаём уже созданное сообщение. */
  private async existingMessage(
    conversationId: number,
    clientMessageId: string,
  ): Promise<SupportAppendResult | null> {
    const [message, conversation] = await Promise.all([
      this.prisma.supportMessage.findFirst({
        where: { conversationId, clientMessageId },
        include: MESSAGE_INCLUDE,
      }),
      this.prisma.supportConversation.findUnique({
        where: { id: conversationId },
      }),
    ]);
    if (!message || !conversation) {
      this.logger.warn(
        `P2002 без существующего сообщения conversationId=${conversationId} clientMessageId=${clientMessageId}`,
      );
      return null;
    }
    return { conversation, message: this.messageRecord(message), created: false };
  }

  private withContact({
    conversation,
    ...message
  }: MessageWithContactRow): SupportMessageWithContact {
    return {
      ...this.messageRecord(message),
      contactId: conversation.contactId,
    };
  }

  private messageRecord({ replyTo, ...row }: MessageRow): SupportMessageRecord {
    if (!replyTo) return { ...row, replyTo: null };
    const { _count, ...reply } = replyTo;
    return {
      ...row,
      replyTo: { ...reply, attachmentsCount: _count.attachments },
    };
  }

  /**
   * Цитировать можно только сообщение этого же диалога; заметку — только из заметки,
   * иначе клиент увидел бы её текст в цитате. Чужой id не ошибка отправки: ответ уйдёт без цитаты.
   */
  private async replyTarget(
    tx: Prisma.TransactionClient,
    conversationId: number,
    replyToId: number,
    input: SupportMessageInput,
  ): Promise<number | null> {
    const target = await tx.supportMessage.findFirst({
      where: {
        id: replyToId,
        conversationId,
        ...(input.isInternalNote ? {} : { isInternalNote: false }),
      },
      select: { id: true },
    });
    if (!target) {
      this.logger.warn(
        `Цитата недоступна conversationId=${conversationId} replyToId=${replyToId} author=${input.author}`,
      );
    }
    return target?.id ?? null;
  }

  private async nullIfNotFound<T>(action: () => Promise<T>): Promise<T | null> {
    try {
      return await action();
    } catch (error) {
      if (this.isPrismaError(error, 'P2025')) return null;
      throw error;
    }
  }

  private isPrismaError(error: unknown, code: string): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === code
    );
  }
}
