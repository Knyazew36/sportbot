import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { paginatePrisma } from '@/common/prisma/prisma-paginate';
import { ENTITY_EMOJI } from '@/common/utils';
import { JoinRequestStatus, OrgRole, Prisma } from '@/generated/prisma/client';
import { NotificationsService } from '@/notifications/notifications.service';
import { PrismaService } from 'prisma/prisma.service';

import { UploadService } from '../upload/upload.service';

import { JoinRequestQueryDto } from './dto/join-request-query.dto';
import { JoinRequestResponseDto } from './dto/join-request.response.dto';

const JOIN_REQUEST_SELECT = {
  id: true,
  organizationId: true,
  userId: true,
  inviteId: true,
  status: true,
  createdAt: true,
  decidedAt: true,
  organization: { select: { name: true } },
  user: {
    select: {
      email: true,
      name: true,
      lastName: true,
      avatarPath: true,
      phone: true,
    },
  },
} satisfies Prisma.JoinRequestSelect;

type JoinRequestRow = Prisma.JoinRequestGetPayload<{
  select: typeof JOIN_REQUEST_SELECT;
}>;

@Injectable()
export class JoinRequestService {
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.joinRequest} ${JoinRequestService.name}`,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── Списки ──────────────────────────────────────────────────────────────

  /** Заявки организации. Доступ проверяет OrgScopeGuard + CASL (manage JoinRequest). */
  public async list(organizationId: number, query: JoinRequestQueryDto) {
    const where: Prisma.JoinRequestWhereInput = {
      organizationId,
      ...(query.status ? { status: query.status } : {}),
    };

    const { items, meta } = await paginatePrisma(this.prisma.joinRequest, {
      ...query,
      where,
      select: JOIN_REQUEST_SELECT,
    });
    this.logger.log(`list org=${organizationId}: ${meta.total}`);
    return {
      items: (items as unknown as JoinRequestRow[]).map((row) =>
        this.toDto(row),
      ),
      meta,
    };
  }

  /** Свои заявки во всех организациях, свежие сверху. */
  public async listMine(userId: number): Promise<JoinRequestResponseDto[]> {
    const rows = await this.prisma.joinRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: JOIN_REQUEST_SELECT,
    });
    this.logger.log(`listMine userId=${userId}: ${rows.length}`);
    return rows.map((row) => this.toDto(row));
  }

  // ── Решения ─────────────────────────────────────────────────────────────

  /** Одобрить заявку: создаёт членство MEMBER и увеличивает Invite.usedCount. */
  public async approve(
    id: number,
    decidedByUserId: number,
  ): Promise<JoinRequestResponseDto> {
    const row = await this.prisma.$transaction(async (tx) => {
      const decided = await this.decide(
        tx,
        { id },
        JoinRequestStatus.APPROVED,
        decidedByUserId,
      );
      await tx.organizationMembership.upsert({
        where: {
          organizationId_userId: {
            organizationId: decided.organizationId,
            userId: decided.userId,
          },
        },
        create: {
          organizationId: decided.organizationId,
          userId: decided.userId,
          role: OrgRole.MEMBER,
        },
        update: {},
      });
      if (decided.inviteId) {
        await tx.invite.update({
          where: { id: decided.inviteId },
          data: { usedCount: { increment: 1 } },
        });
      }
      return decided;
    });

    this.logger.log(
      `Заявка id=${id} org=${row.organizationId} одобрена decidedBy=${decidedByUserId}`,
    );
    await this.notifyApplicant(row, true);
    return this.toDto(row);
  }

  /** Отклонить заявку — членство не создаётся. */
  public async reject(
    id: number,
    decidedByUserId: number,
  ): Promise<JoinRequestResponseDto> {
    const row = await this.decide(
      this.prisma,
      { id },
      JoinRequestStatus.REJECTED,
      decidedByUserId,
    );
    this.logger.log(
      `Заявка id=${id} org=${row.organizationId} отклонена decidedBy=${decidedByUserId}`,
    );
    await this.notifyApplicant(row, false);
    return this.toDto(row);
  }

  /** Заявитель отменяет свою же заявку, пока она не рассмотрена. */
  public async cancel(
    id: number,
    userId: number,
  ): Promise<JoinRequestResponseDto> {
    // userId в where — чужую заявку отменить нельзя, она просто «не найдётся»
    const row = await this.decide(
      this.prisma,
      { id, userId },
      JoinRequestStatus.CANCELLED,
      userId,
    );
    this.logger.log(
      `Заявка id=${id} org=${row.organizationId} отменена userId=${userId}`,
    );
    return this.toDto(row);
  }

  // ── Вспомогательное ─────────────────────────────────────────────────────

  /** Перевод PENDING-заявки в итоговый статус. Статус в where — уже рассмотренная даст P2025. */
  private async decide(
    client: Prisma.TransactionClient,
    where: { id: number; userId?: number },
    status: JoinRequestStatus,
    decidedByUserId: number,
  ): Promise<JoinRequestRow> {
    try {
      return await client.joinRequest.update({
        where: { ...where, status: JoinRequestStatus.PENDING },
        data: { status, decidedAt: new Date(), decidedByUserId },
        select: JOIN_REQUEST_SELECT,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Заявка не найдена или уже рассмотрена');
      }
      throw e;
    }
  }

  /** Сообщает заявителю решение. Сбой доставки не должен ронять approve()/reject(). */
  private async notifyApplicant(
    row: JoinRequestRow,
    approved: boolean,
  ): Promise<void> {
    try {
      await this.notifications.notifyUser(
        'JOIN_REQUEST_DECIDED',
        row.organizationId,
        row.userId,
        {
          title: approved ? 'Заявка одобрена' : 'Заявка отклонена',
          body: approved
            ? `Вас приняли в «${row.organization.name}» ✅`
            : `Заявка на вступление в «${row.organization.name}» отклонена`,
          payload: { joinRequestId: row.id },
        },
      );
    } catch (error) {
      this.logger.warn(
        `Не удалось уведомить заявителя userId=${row.userId} о решении заявки id=${row.id}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private toDto(row: JoinRequestRow): JoinRequestResponseDto {
    return {
      id: row.id,
      organizationId: row.organizationId,
      organizationName: row.organization.name,
      userId: row.userId,
      email: row.user.email,
      name: row.user.name,
      lastName: row.user.lastName,
      avatarUrl: this.uploadService.toPublicUrl(row.user.avatarPath),
      phone: row.user.phone,
      inviteId: row.inviteId,
      status: row.status,
      createdAt: row.createdAt,
      decidedAt: row.decidedAt,
    };
  }
}
