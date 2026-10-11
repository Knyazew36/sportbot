import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { PrismaService } from 'prisma/prisma.service';

import { Prisma } from '@/generated/prisma/client';
import { paginatePrisma } from '@/common/prisma';
import { PaginationQueryDto } from '@/common/type';
import { ENTITY_EMOJI } from '@/common/utils';
import { MessengerRegistry } from '@/messengers';

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
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.chat} ${ChatService.name}`,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly uploadService: UploadService,
    private readonly messengers: MessengerRegistry,
  ) {}

  // ── CRUD ────────────────────────────────────────────────────────────────

  public async create(
    dto: CreateChatSubmissionDto,
    files: Express.Multer.File[],
  ): Promise<ChatSubmissionDto> {
    files.forEach((file) =>
      this.uploadService.verifyImageSignatureOrThrow(file),
    );

    // При любой ошибке ниже файлы из стейджинга уберёт CleanupStagedUploadsInterceptor
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
      `Новое сообщение из чата id=${submission.id}, файлов=${files.length}`,
    );

    this.notify(submission).catch((error) =>
      this.logger.error(
        `Не удалось уведомить админов о сообщении id=${submission.id}`,
        error instanceof Error ? error.stack : error,
      ),
    );

    return this.toDto(submission);
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
    this.logger.log(`list: найдено ${result.meta.total}`);
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
      this.logger.log(`Сообщение удалено id=${id}`);
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

  /**
   * Сообщение с сайта получают платформенные админы во всех мессенджерах, где бот может им
   * писать. Никого нет или ни один мессенджер не подключён — сообщение просто остаётся в БД.
   */
  private async notify(submission: ChatSubmissionRow) {
    const channels = this.messengers.list();
    const admins = channels.length
      ? await this.prisma.user.findMany({
          where: { isPlatformAdmin: true },
        })
      : [];
    const targets = admins.flatMap((admin) =>
      channels
        .filter((channel) => channel.canDeliver(admin))
        .map((channel) => ({ admin, channel })),
    );
    if (targets.length === 0) {
      this.logger.warn(
        `Некому отправить уведомление о сообщении id=${submission.id}: нет админов с подключённым мессенджером`,
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
      `📩 Новое сообщение с сайта «${this.config.get<string>('APP_NAME')}»`,
      contact,
      attachments,
      submission.message,
    ]
      .filter(Boolean)
      .join('\n');

    await Promise.all(
      targets.map(({ admin, channel }) =>
        channel
          .send(admin, { text })
          .catch((error) =>
            this.logger.error(
              `Не удалось отправить уведомление канал=${channel.channel} userId=${admin.id} id=${submission.id}`,
              error instanceof Error ? error.stack : error,
            ),
          ),
      ),
    );
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
