import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { AdminIdentity, isAdmin } from '@/bot/bot.types';
import { BotSender } from '@/bot/bot-sender.service';
import { paginatePrisma } from '@/common/prisma';
import { PaginationQueryDto } from '@/common/type';
import { ENTITY_EMOJI } from '@/common/utils';
import { Prisma, User } from '@/generated/prisma/client';

import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackResponseDto } from './dto/feedback.response.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

const FEEDBACK_INCLUDE = {
  replies: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.FeedbackInclude;

type FeedbackFull = Prisma.FeedbackGetPayload<{
  include: typeof FEEDBACK_INCLUDE;
}>;

/** Метку #fb<id> админ видит в уведомлении, по ней ответ реплаем находит обращение. */
const TAG_PATTERN = /#fb(\d+)/;
const QUOTE_LENGTH = 120;

/**
 * Идеи и проблемы от пользователей. Админам уходят в мессенджер; ответ админа реплаем
 * на уведомление возвращается автору личным сообщением бота. Чата в приложении нет.
 */
@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.feedback} ${FeedbackService.name}`,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly sender: BotSender,
  ) {}

  // ── Пользователь ────────────────────────────────────────────────────────

  public async create(
    userId: number,
    dto: CreateFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    const item = await this.prisma.feedback.create({
      data: { userId, text: dto.text },
      include: { ...FEEDBACK_INCLUDE, user: true },
    });
    this.logger.log(`Обращение создано: id=${item.id}, userId=${userId}`);
    // Автору не важно, дошло ли админам: сбой доставки только в лог
    void this.notifyAdmins(item.id, item.user, item.text);
    return this.view(item);
  }

  public async list(userId: number, query: PaginationQueryDto) {
    const { items, meta } = await paginatePrisma(this.prisma.feedback, {
      ...query,
      where: { userId },
      include: FEEDBACK_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    this.logger.debug(
      `Список обращений: userId=${userId}, всего=${meta.total}`,
    );
    return { items: (items as unknown as FeedbackFull[]).map((item) => this.view(item)),
      meta };
  }

  public async find(userId: number, id: number): Promise<FeedbackResponseDto> {
    const item = await this.prisma.feedback.findFirst({
      where: { id, userId },
      include: FEEDBACK_INCLUDE,
    });
    if (!item) throw new NotFoundException('Обращение не найдено.');
    return this.view(item);
  }

  /** Править можно, пока команда не ответила: иначе ответ повиснет на другом тексте. */
  public async update(
    userId: number,
    id: number,
    dto: UpdateFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    try {
      const item = await this.prisma.feedback.update({
        where: { id, userId, replies: { none: {} } },
        data: { text: dto.text },
        include: FEEDBACK_INCLUDE,
      });
      this.logger.log(`Обращение изменено: id=${id}, userId=${userId}`);
      return this.view(item);
    } catch (error) {
      throw this.known(error);
    }
  }

  public async remove(userId: number, id: number): Promise<void> {
    try {
      await this.prisma.feedback.delete({ where: { id, userId } });
    } catch (error) {
      throw this.known(error);
    }
    this.logger.log(`Обращение удалено: id=${id}, userId=${userId}`);
  }

  // ── Ответ из мессенджера ────────────────────────────────────────────────

  /**
   * Админ ответил реплаем на уведомление об обращении.
   * @returns что показать админу в ответ; null — это не ответ на обращение, сообщение обрабатывается как обычно.
   */
  public async replyFromAdmin(
    admin: AdminIdentity & Pick<User, 'id'>,
    quotedText: string,
    text: string,
  ): Promise<string | null> {
    const feedbackId = Number(TAG_PATTERN.exec(quotedText)?.[1]);
    if (!feedbackId || !isAdmin(admin)) return null;

    const answer = text.trim();
    if (!answer) return '✏️ Ответь на уведомление текстом.';

    let reply: Prisma.FeedbackReplyGetPayload<{
      include: { feedback: true };
    }>;
    try {
      reply = await this.prisma.feedbackReply.create({
        data: { feedbackId, text: answer },
        include: { feedback: true },
      });
    } catch (error) {
      // Автор успел удалить обращение — отвечать некому
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        this.logger.warn(
          `Ответ на удалённое обращение: id=${feedbackId}, adminId=${admin.id}`,
        );
        return '🗑 Автор уже удалил это обращение.';
      }
      throw error;
    }

    const { feedback } = reply;
    const delivered = await this.sender.sendToUserId(feedback.userId, {
      text: `💬 Ответ на твоё сообщение «${this.cut(feedback.text)}»\n\n${answer}`,
    });
    this.logger.log(
      `Ответ на обращение: id=${feedbackId}, adminId=${admin.id}, доставлен=${delivered}`,
    );
    return delivered
      ? '✅ Ответ отправлен.'
      : '⚠️ Ответ сохранён, но не доставлен: пользователь не запускал бота или заблокировал его.';
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private async notifyAdmins(
    id: number,
    author: User,
    text: string,
  ): Promise<void> {
    const name =
      [author.name, author.lastName].filter(Boolean).join(' ') || 'Без имени';
    try {
      await this.sender.sendToAdmins({
        text: [
          `💡 Новое обращение #fb${id}`,
          `От: ${name} (userId ${author.id})`,
          '',
          text,
          '',
          'Ответь реплаем на это сообщение — ответ уйдёт автору в мессенджер.',
        ].join('\n'),
      });
    } catch (error) {
      this.logger.error(
        `Админам не отправлено: id=${id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private cut(text: string): string {
    return text.length > QUOTE_LENGTH
      ? `${text.slice(0, QUOTE_LENGTH).trimEnd()}…`
      : text;
  }

  private view(item: FeedbackFull): FeedbackResponseDto {
    return {
      id: item.id,
      text: item.text,
      createdAt: item.createdAt.toISOString(),
      replies: item.replies.map((reply) => ({
        id: reply.id,
        text: reply.text,
        createdAt: reply.createdAt.toISOString(),
      })),
    };
  }

  private known(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    )
      return new NotFoundException(
        'Обращение не найдено или на него уже ответили.',
      );
    return error;
  }
}
