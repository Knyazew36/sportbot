import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { APP_SCREEN, appBtn, BotSender, isAdmin, msg } from '@/bot';
import {
  CatalogService,
  EXERCISE_INCLUDE,
  STRETCH_INCLUDE,
} from '@/catalog/catalog.service';
import {
  exerciseForm,
  proposalChanges,
  readProposal,
  stretchForm,
} from '@/catalog/catalog-proposal';
import { paginatePrisma } from '@/common/prisma';
import { PaginationQueryDto } from '@/common/type/pagination-query.dto';
import { Prisma } from '@/generated/prisma/client';
import { UploadService } from '@/upload/upload.service';
import {
  Decision,
  ModerationService,
  REQUEST_INCLUDE,
  RequestFull,
} from '@/moderation/moderation.service';

import { AdminService } from './admin.service';
import { ComplaintService } from './complaint.service';
import { AdminComplaintResponseDto } from './dto/admin-complaint.response.dto';
import { AdminComplaintsQueryDto } from './dto/admin-complaints-query.dto';
import { AdminRequestResponseDto } from './dto/admin-request.response.dto';
import { AdminUserResponseDto } from './dto/admin-user.response.dto';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { ImportReportResponseDto } from './dto/import-report.response.dto';
import { ImportService } from './import.service';

const COMPLAINT_INCLUDE = {
  exercise: { include: EXERCISE_INCLUDE },
  stretch: { include: STRETCH_INCLUDE },
  user: { select: { sportProfile: { select: { displayName: true } } } },
} satisfies Prisma.ComplaintInclude;

type ComplaintRow = Prisma.ComplaintGetPayload<{
  include: typeof COMPLAINT_INCLUDE;
}>;

const USER_INCLUDE = {
  sportProfile: { select: { displayName: true, onboardedAt: true } },
} satisfies Prisma.UserInclude;

type UserRow = Prisma.UserGetPayload<{ include: typeof USER_INCLUDE }>;

const username = (data: unknown): string | null => {
  const value = (data as { username?: unknown } | null)?.username;
  return typeof value === 'string' ? value : null;
};

/** Админ спортбота в Mini App (frontend-tz, 14): модерация, жалобы, пользователи, импорт. */
@Injectable()
export class AdminAppService {
  private readonly logger = new Logger(`🛠 ${AdminAppService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly admin: AdminService,
    private readonly moderation: ModerationService,
    private readonly catalog: CatalogService,
    private readonly imports: ImportService,
    private readonly sender: BotSender,
    private readonly complaintService: ComplaintService,
    private readonly uploads: UploadService,
  ) {}

  public counters() {
    return this.admin.counters();
  }

  // ── Модерация ───────────────────────────────────────────────────────────

  /** Очередь заявок: автор, запись, похожие записи справочника. */
  public async requests(query: PaginationQueryDto) {
    const page = await paginatePrisma(this.prisma.moderationRequest, {
      page: query.page,
      limit: query.limit,
      where: { outcome: 'PENDING' },
      orderBy: { id: 'asc' },
      include: REQUEST_INCLUDE,
    });
    return {
      items: await Promise.all(
        (page.items as unknown as RequestFull[]).map((r) =>
          this.requestView(r),
        ),
      ),
      meta: page.meta,
    };
  }

  public async request(requestId: number): Promise<AdminRequestResponseDto> {
    return this.requestView(await this.moderation.find(requestId));
  }

  /** Одобрить; с правками — техника, картинка, инвентарь, суставы. Автору — сообщение в бот. */
  public async approve(requestId: number, dto: ApproveRequestDto) {
    const { reason, ...edits } = dto;
    const edited = Object.values(edits).some((v) => v !== undefined);
    const decision = await this.moderation.approve(
      requestId,
      edited ? edits : undefined,
      reason,
    );
    await this.notifyAuthor(decision);
    return this.request(requestId);
  }

  public async duplicate(requestId: number, targetId: number, reason?: string) {
    const decision = await this.moderation.duplicate(
      requestId,
      targetId,
      reason,
    );
    await this.notifyAuthor(decision);
    return this.request(requestId);
  }

  public async reject(requestId: number, reason: string) {
    const decision = await this.moderation.reject(requestId, reason);
    await this.notifyAuthor(decision);
    return this.request(requestId);
  }

  // ── Жалобы ──────────────────────────────────────────────────────────────

  public async complaints(query: AdminComplaintsQueryDto) {
    const page = await paginatePrisma(this.prisma.complaint, {
      page: query.page,
      limit: query.limit,
      where: { status: query.filter_status ?? 'OPEN' },
      orderBy: { id: 'desc' },
      include: COMPLAINT_INCLUDE,
    });
    const names = await this.catalog.refNames();
    return {
      items: (page.items as unknown as ComplaintRow[]).map((c) =>
        this.complaintView(c, names),
      ),
      meta: page.meta,
    };
  }

  public async closeComplaint(
    complaintId: number,
    status: 'RESOLVED' | 'REJECTED',
    reason?: string,
  ): Promise<void> {
    if (!(await this.complaintService.close(complaintId, status, reason)))
      throw new BadRequestException('Жалоба уже обработана.');
  }

  public async applyComplaint(complaintId: number): Promise<void> {
    if (!(await this.complaintService.apply(complaintId)))
      throw new BadRequestException('Жалоба уже обработана.');
  }

  // ── Пользователи ────────────────────────────────────────────────────────

  /** Список с поиском по имени, нику или id. */
  public async users(query: PaginationQueryDto) {
    const text = query.search?.trim();
    const id = text && /^\d+$/.test(text) ? Number(text) : undefined;
    const where: Prisma.UserWhereInput = {
      sportProfile: { isNot: null },
      ...(text && {
        OR: [
          ...(id ? [{ id }, { telegramId: text }, { maxId: text }] : []),
          {
            sportProfile: {
              displayName: { contains: text, mode: 'insensitive' },
            },
          },
          { name: { contains: text, mode: 'insensitive' } },
        ],
      }),
    };
    const page = await paginatePrisma(this.prisma.user, {
      page: query.page,
      limit: query.limit,
      where,
      orderBy: { id: 'desc' },
      include: USER_INCLUDE,
    });
    const users = page.items as unknown as UserRow[];
    const blocked = await this.prisma.blockedAccount.findMany({
      where: {
        OR: [
          {
            channel: 'TELEGRAM',
            externalId: {
              in: users.flatMap((u) => (u.telegramId ? [u.telegramId] : [])),
            },
          },
          {
            channel: 'MAX',
            externalId: {
              in: users.flatMap((u) => (u.maxId ? [u.maxId] : [])),
            },
          },
        ],
      },
    });
    const isBlocked = (u: UserRow) =>
      blocked.some(
        (b) =>
          (b.channel === 'TELEGRAM' && b.externalId === u.telegramId) ||
          (b.channel === 'MAX' && b.externalId === u.maxId),
      );
    return {
      items: users.map((u): AdminUserResponseDto => ({
        id: u.id,
        displayName: u.sportProfile?.displayName ?? u.name ?? 'Без имени',
        telegramId: u.telegramId,
        maxId: u.maxId,
        username: username(u.telegramData) ?? username(u.maxData),
        blocked: isBlocked(u),
        onboarded: !!u.sportProfile?.onboardedAt,
        isAdmin: isAdmin(u),
        createdAt: u.createdAt,
      })),
      meta: page.meta,
    };
  }

  /** Блокировка по всем мессенджерам пользователя (business-tz, 30.3). Себя заблокировать нельзя. */
  public async block(adminId: number, userId: number): Promise<void> {
    if (adminId === userId)
      throw new BadRequestException('Себя заблокировать нельзя.');
    await this.admin.block(userId);
  }

  public unblock(userId: number): Promise<void> {
    return this.admin.unblock(userId);
  }

  // ── Импорт ──────────────────────────────────────────────────────────────

  /** Проверка файла без записи: сколько создастся, обновится и ошибки по строкам. */
  public async importCheck(raw: string): Promise<ImportReportResponseDto> {
    const { report } = await this.imports.check(raw);
    this.logger.log(
      `Импорт проверен: создать=${report.create}, обновить=${report.update}, ошибок=${report.errors.length}`,
    );
    return report;
  }

  public async importApply(raw: string): Promise<ImportReportResponseDto> {
    return this.imports.apply(raw);
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private async notifyAuthor(decision: Decision): Promise<void> {
    if (decision.authorId)
      await this.sender.sendToUserId(
        decision.authorId,
        msg(decision.text, [[appBtn(APP_SCREEN.mine)]]),
      );
  }

  private async requestView(
    request: RequestFull,
  ): Promise<AdminRequestResponseDto> {
    const entry = request.exercise ?? request.stretch;
    const kind =
      request.exerciseId || request.duplicateOfExerciseId
        ? 'exercise'
        : 'stretch';
    const similar = entry
      ? (await this.catalog.similar(kind, entry.name)).filter(
          (s) => s.id !== entry.id,
        )
      : [];
    return {
      id: request.id,
      kind,
      author: request.author?.sportProfile?.displayName ?? null,
      outcome: request.outcome,
      createdAt: request.createdAt,
      entry: request.exercise
        ? {
            id: request.exercise.id,
            name: request.exercise.name,
            text: request.exercise.technique,
            videoUrl: request.exercise.videoUrl,
            primaryMuscles: request.exercise.muscles
              .filter((m) => m.role === 'PRIMARY')
              .map((m) => m.muscle.name),
            secondaryMuscles: request.exercise.muscles
              .filter((m) => m.role === 'SECONDARY')
              .map((m) => m.muscle.name),
            holdSeconds: null,
            perSide: null,
          }
        : request.stretch
          ? {
              id: request.stretch.id,
              name: request.stretch.name,
              text: request.stretch.howTo,
              videoUrl: null,
              primaryMuscles: request.stretch.muscles.map((m) => m.muscle.name),
              secondaryMuscles: [],
              holdSeconds: request.stretch.holdSeconds,
              perSide: request.stretch.perSide,
            }
          : null,
      similar,
    };
  }

  private complaintView(
    complaint: ComplaintRow,
    names: Awaited<ReturnType<CatalogService['refNames']>>,
  ): AdminComplaintResponseDto {
    const entry = complaint.exercise ?? complaint.stretch;
    const proposal = readProposal(complaint.proposal);
    const changes = !proposal
      ? []
      : complaint.exercise
        ? proposalChanges(
            'exercise',
            exerciseForm(complaint.exercise),
            proposal,
            names,
          )
        : complaint.stretch
          ? proposalChanges(
              'stretch',
              stretchForm(complaint.stretch),
              proposal,
              names,
            )
          : [];
    return {
      id: complaint.id,
      text: complaint.text,
      // Админке картинку показываем, поэтому вместо путей — адреса файлов
      changes: changes.map((c) =>
        c.field === 'imagePath'
          ? {
              ...c,
              before: this.uploads.toPublicUrl(c.before),
              after: this.uploads.toPublicUrl(c.after),
            }
          : c,
      ),
      status: complaint.status,
      kind: complaint.exercise ? 'exercise' : 'stretch',
      entryId: entry?.id ?? null,
      entryName: entry?.name ?? 'Удалённая запись',
      author: complaint.user?.sportProfile?.displayName ?? null,
      createdAt: complaint.createdAt,
    };
  }
}
