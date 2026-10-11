import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { PrismaService } from 'prisma/prisma.service';

import { Prisma } from '@/generated/prisma/client';
import { paginatePrisma } from '@/common/prisma';
import { PaginationQueryDto } from '@/common/type';
import { ENTITY_EMOJI } from '@/common/utils';

import { BotMaxService } from '../bot-max/bot-max.service';
import { UploadService } from '../upload/upload.service';

import { ChatSubmissionDto } from './dto/chat-submission.dto';
import { CreateChatSubmissionDto } from './dto/create-chat-submission.dto';

const CHAT_UPLOAD_CATEGORY = 'chat';

type ChatSubmissionRow = {
  id: number;
  message: string;
  phone: string | null;
  email: string | null;
  filePaths: string[];
  createdAt: Date;
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly uploadService: UploadService,
    private readonly botMaxService: BotMaxService,
  ) {}

  // ── CRUD ────────────────────────────────────────────────────────────────

  public async create(
    dto: CreateChatSubmissionDto,
    files: Express.Multer.File[],
  ): Promise<ChatSubmissionDto> {
    files.forEach((file) =>
      this.uploadService.verifyImageSignatureOrThrow(file),
    );

    try {
      const submission = await this.prisma.chatSubmission.create({
        data: {
          message: dto.message,
          phone: dto.phone || null,
          email: dto.email || null,
          filePaths: files.map(
            (file) => `${CHAT_UPLOAD_CATEGORY}/${path.basename(file.path)}`,
          ),
        },
      });

      files.forEach((file) =>
        this.uploadService.commitToCategory(file.path, CHAT_UPLOAD_CATEGORY),
      );
      this.logger.log(
        `${ENTITY_EMOJI.chat} Новое сообщение из чата id=${submission.id}, файлов=${files.length}`,
      );

      this.notify(submission).catch((error) =>
        this.logger.error(
          `${ENTITY_EMOJI.chat} Не удалось отправить MAX-уведомление id=${submission.id}`,
          error instanceof Error ? error.stack : error,
        ),
      );

      return this.toDto(submission);
    } catch (error) {
      files.forEach((file) => this.uploadService.discardTmpFile(file.path));
      throw error;
    }
  }

  public async list(query: PaginationQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.ChatSubmissionWhereInput | undefined = search
      ? {
          OR: [
            { message: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const result = await paginatePrisma(this.prisma.chatSubmission, {
      page: query.page,
      limit: query.limit,
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { ...result, items: result.items.map((item) => this.toDto(item)) };
  }

  public async findOne(id: number): Promise<ChatSubmissionDto> {
    const submission = await this.prisma.chatSubmission.findUnique({
      where: { id },
    });
    if (!submission) {
      throw new NotFoundException('Сообщение не найдено');
    }
    return this.toDto(submission);
  }

  public async remove(id: number): Promise<ChatSubmissionDto> {
    try {
      const submission = await this.prisma.chatSubmission.delete({
        where: { id },
      });
      submission.filePaths.forEach((filePath) =>
        this.uploadService.deleteByRelativePath(filePath),
      );
      this.logger.log(`${ENTITY_EMOJI.chat} Сообщение удалено id=${id}`);
      return this.toDto(submission);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Сообщение не найдено');
      }
      throw error;
    }
  }

  // ── Уведомления ─────────────────────────────────────────────────────────

  private async notify(submission: ChatSubmissionRow) {
    const recipients = this.resolveRecipientMaxIds();
    if (recipients.length === 0) {
      this.logger.warn(
        `${ENTITY_EMOJI.chat} Нет получателей MAX-уведомления (MAX_NOTIFY_USER_ID не задан) id=${submission.id}`,
      );
      return;
    }

    const contact = [
      submission.phone && `Телефон: ${submission.phone}`,
      submission.email && `Email: ${submission.email}`,
    ]
      .filter(Boolean)
      .join(', ');
    const attachments =
      submission.filePaths.length > 0 &&
      `Вложений: ${submission.filePaths.length}`;
    const text = [
      '📩 Новое сообщение из чата «КРУЖОК»',
      contact,
      attachments,
      submission.message,
    ]
      .filter(Boolean)
      .join('\n');

    await Promise.all(
      recipients.map((maxId) =>
        this.botMaxService.sendMessage(maxId, text).catch((error) =>
          this.logger.error(
            `${ENTITY_EMOJI.chat} Не удалось отправить MAX-уведомление maxId=${maxId} id=${submission.id}`,
            error instanceof Error ? error.stack : error,
          ),
        ),
      ),
    );
  }

  /**
   * Кому слать уведомление о новом сообщении. Сейчас — один человек из env;
   * если получателей станет больше (список, роли в БД), меняется только эта функция.
   */
  private resolveRecipientMaxIds(): string[] {
    const maxId = this.config.get<string>('MAX_NOTIFY_USER_ID');
    return maxId ? [maxId] : [];
  }

  // ── Маппинг ─────────────────────────────────────────────────────────────

  private toDto(submission: ChatSubmissionRow): ChatSubmissionDto {
    return {
      id: submission.id,
      message: submission.message,
      phone: submission.phone,
      email: submission.email,
      fileUrls: submission.filePaths
        .map((filePath) => this.uploadService.toPublicUrl(filePath))
        .filter((url): url is string => Boolean(url)),
      createdAt: submission.createdAt,
    };
  }
}
