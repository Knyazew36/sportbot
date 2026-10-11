import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { JoinRequestStatus, OrgRole, Prisma } from '@/generated/prisma/client';
import { ENTITY_EMOJI } from '@/common/utils';
import {
  resolveAvatarUrl,
  resolveVkName,
} from '@/common/vk/resolve-vk-profile';
import { PrismaService } from 'prisma/prisma.service';

import { JoinRequestRelativeResponseDto } from './dto/join-request-relative.response.dto';
import { JoinRequestQueryDto } from './dto/join-request-query.dto';
import { JoinRequestResponseDto } from './dto/join-request.response.dto';
import { isOrganizationAvailable, ORGANIZATION_AVAILABILITY_SELECT } from '../common/organization/organization-availability';
import { UploadService } from '../upload/upload.service';
import { VkService } from '../vk/vk.service';

const RELATIVE_SELECT = {
  id: true,
  name: true,
  lastName: true,
  email: true,
  phone: true,
  avatarPath: true,
  vkData: true,
  birthDate: true,
} satisfies Prisma.UserSelect;

const JOIN_REQUEST_SELECT = {
  id: true,
  organizationId: true,
  userId: true,
  requestedByUserId: true,
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
      vkData: true,
      phone: true,
      birthDate: true,
      parents: { select: RELATIVE_SELECT },
      children: { select: RELATIVE_SELECT },
    },
  },
} satisfies Prisma.JoinRequestSelect;

type JoinRequestRow = Prisma.JoinRequestGetPayload<{
  select: typeof JOIN_REQUEST_SELECT;
}>;

@Injectable()
export class JoinRequestService {
  private readonly logger = new Logger(JoinRequestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly vkService: VkService,
  ) {}

  /**
   * Заявки кружка (владелец). Доступ проверяет OrgScopeGuard + CASL (manage JoinRequest, только владелец).
   * Пагинация вручную (как `paginatePrisma`), а не через хелпер: у `JoinRequestSelect`
   * вложенные `organization`/`user`, дженерик хелпера с ними не типизируется корректно.
   */
  public async list(query: JoinRequestQueryDto) {
    const where: Prisma.JoinRequestWhereInput = {
      organizationId: query.organizationId,
      ...(query.status ? { status: query.status } : {}),
    };
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(1000, Math.max(1, query.limit || 20));
    const orderBy = query.sortBy
      ? { [query.sortBy]: query.order ?? 'desc' }
      : { createdAt: 'desc' as const };

    const [total, rows] = await Promise.all([
      this.prisma.joinRequest.count({ where }),
      this.prisma.joinRequest.findMany({
        where,
        orderBy,
        select: JOIN_REQUEST_SELECT,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    this.logger.log(
      `${ENTITY_EMOJI.joinRequest} list org=${query.organizationId}: ${total}`,
    );
    return {
      items: await this.toDtos(rows),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Заявки, которые подал сам пользователь (включая от имени своих детей),
   * во всех кружках, свежие сверху. `requestedByUserId` пуст только у старых
   * записей до появления родителя-заявителя — тогда заявитель = сам userId.
   */
  public async listMine(userId: number): Promise<JoinRequestResponseDto[]> {
    const rows = await this.prisma.joinRequest.findMany({
      where: {
        OR: [
          { requestedByUserId: userId },
          { requestedByUserId: null, userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: JOIN_REQUEST_SELECT,
    });
    this.logger.log(
      `${ENTITY_EMOJI.joinRequest} listMine userId=${userId}: ${rows.length}`,
    );
    return this.toDtos(rows);
  }

  /** Одобрить заявку: создаёт членство MEMBER (заявителю и родителю, если подал он), увеличивает Invite.usedCount. */
  public async approve(
    id: number,
    ownerUserId: number,
  ): Promise<JoinRequestResponseDto> {
    const joinRequest = await this.assertPending(id);

    const row = await this.prisma.$transaction(async (tx) => {
      // Заявку за ребёнка подал родитель — он тоже становится участником, чтобы видеть кружок и расписание.
      const memberIds = [joinRequest.userId];
      if (
        joinRequest.requestedByUserId &&
        joinRequest.requestedByUserId !== joinRequest.userId
      ) {
        memberIds.push(joinRequest.requestedByUserId);
      }
      for (const memberId of memberIds) {
        const existingMembership = await tx.organizationMembership.findUnique({
          where: {
            organizationId_userId: {
              organizationId: joinRequest.organizationId,
              userId: memberId,
            },
          },
        });
        if (!existingMembership) {
          await tx.organizationMembership.create({
            data: {
              organizationId: joinRequest.organizationId,
              userId: memberId,
              role: OrgRole.MEMBER,
            },
          });
        }
      }
      if (joinRequest.inviteId) {
        await tx.invite.update({
          where: { id: joinRequest.inviteId },
          data: { usedCount: { increment: 1 } },
        });
      }
      return tx.joinRequest.update({
        where: { id },
        data: {
          status: JoinRequestStatus.APPROVED,
          decidedAt: new Date(),
          decidedByUserId: ownerUserId,
        },
        select: JOIN_REQUEST_SELECT,
      });
    });

    this.logger.log(
      `${ENTITY_EMOJI.joinRequest} Заявка id=${id} org=${joinRequest.organizationId} одобрена decidedBy=${ownerUserId}`,
    );
    await this.notifyApplicant(row, true);
    return (await this.toDtos([row]))[0];
  }

  /** Отклонить заявку — членство не создаётся. */
  public async reject(
    id: number,
    ownerUserId: number,
  ): Promise<JoinRequestResponseDto> {
    const joinRequest = await this.assertPending(id);
    const row = await this.prisma.joinRequest.update({
      where: { id },
      data: {
        status: JoinRequestStatus.REJECTED,
        decidedAt: new Date(),
        decidedByUserId: ownerUserId,
      },
      select: JOIN_REQUEST_SELECT,
    });
    this.logger.log(
      `${ENTITY_EMOJI.joinRequest} Заявка id=${id} org=${joinRequest.organizationId} отклонена decidedBy=${ownerUserId}`,
    );
    await this.notifyApplicant(row, false);
    return (await this.toDtos([row]))[0];
  }

  /** Заявитель отменяет свою же заявку, пока она не рассмотрена. */
  public async cancel(
    id: number,
    userId: number,
  ): Promise<JoinRequestResponseDto> {
    const joinRequest = await this.assertPending(id);
    const requestedBy = joinRequest.requestedByUserId ?? joinRequest.userId;
    if (requestedBy !== userId) {
      throw new ForbiddenException('Это не ваша заявка');
    }
    const row = await this.prisma.joinRequest.update({
      where: { id },
      data: {
        status: JoinRequestStatus.CANCELLED,
        decidedAt: new Date(),
        decidedByUserId: userId,
      },
      select: JOIN_REQUEST_SELECT,
    });
    this.logger.log(
      `${ENTITY_EMOJI.joinRequest} Заявка id=${id} org=${joinRequest.organizationId} отменена userId=${userId}`,
    );
    return (await this.toDtos([row]))[0];
  }

  // ---------- helpers ----------

  /** Сообщает заявителю в VK решение по заявке. Ошибка отправки не должна ронять approve()/reject(). */
  private async notifyApplicant(
    row: JoinRequestRow,
    approved: boolean,
  ): Promise<void> {
    const applicantId = row.requestedByUserId ?? row.userId;
    const applicant = await this.prisma.user.findUnique({
      where: { id: applicantId },
      select: { vkUserId: true, vkMessagesAllowed: true },
    });
    if (!applicant?.vkUserId || !applicant.vkMessagesAllowed) {
      this.logger.log(
        `${ENTITY_EMOJI.joinRequest} Нет VK-адресата у заявителя userId=${applicantId}, уведомление о решении не отправлено`,
      );
      return;
    }

    const text = approved
      ? `Заявка на вступление в «${row.organization.name}» одобрена ✅`
      : `Заявка на вступление в «${row.organization.name}» отклонена`;

    try {
      await this.vkService.sendMessage(applicant.vkUserId, text);
      this.logger.log(
        `${ENTITY_EMOJI.joinRequest} Уведомление о решении заявки id=${row.id} отправлено userId=${applicantId}`,
      );
    } catch (error) {
      this.logger.warn(
        `${ENTITY_EMOJI.joinRequest} Не удалось уведомить заявителя userId=${applicantId} о решении заявки id=${row.id}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async assertPending(id: number) {
    const joinRequest = await this.prisma.joinRequest.findUnique({
      where: { id },
      select: {
        id: true,
        organizationId: true,
        userId: true,
        requestedByUserId: true,
        inviteId: true,
        status: true,
        organization: { select: ORGANIZATION_AVAILABILITY_SELECT },
      },
    });
    if (!joinRequest) {
      throw new NotFoundException('Заявка не найдена');
    }
    if (joinRequest.status !== JoinRequestStatus.PENDING) {
      throw new ConflictException('Заявка уже рассмотрена');
    }
    if (!isOrganizationAvailable(joinRequest.organization)) {
      throw new ConflictException('Кружок недоступен — заявку нельзя рассмотреть');
    }
    return joinRequest;
  }

  private toRelativeDto(
    user: JoinRequestRow['user']['parents'][number],
  ): JoinRequestRelativeResponseDto {
    return {
      userId: user.id,
      ...resolveVkName(user.name, user.lastName, user.vkData),
      email: user.email,
      phone: user.phone,
      avatarUrl: resolveAvatarUrl(
        user.avatarPath,
        user.vkData,
        this.uploadService,
      ),
      birthDate: user.birthDate,
    };
  }

  /**
   * Родитель-заявитель (requestedByUserId) без FK в схеме — читаем одним запросом на весь список.
   * Заполняется, только когда заявку подали за ребёнка (requestedByUserId ≠ userId).
   */
  private async toDtos(
    rows: JoinRequestRow[],
  ): Promise<JoinRequestResponseDto[]> {
    const requesterIds = [
      ...new Set(
        rows
          .filter(
            (r) => r.requestedByUserId && r.requestedByUserId !== r.userId,
          )
          .map((r) => r.requestedByUserId as number),
      ),
    ];
    const requesters = requesterIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: requesterIds } },
          select: RELATIVE_SELECT,
        })
      : [];
    const byId = new Map(requesters.map((u) => [u.id, this.toRelativeDto(u)]));
    return rows.map((row) =>
      this.toDto(row, byId.get(row.requestedByUserId ?? -1) ?? null),
    );
  }

  private toDto(
    row: JoinRequestRow,
    requestedBy: JoinRequestRelativeResponseDto | null,
  ): JoinRequestResponseDto {
    return {
      id: row.id,
      organizationId: row.organizationId,
      organizationName: row.organization.name,
      userId: row.userId,
      email: row.user.email,
      ...resolveVkName(row.user.name, row.user.lastName, row.user.vkData),
      avatarUrl: resolveAvatarUrl(
        row.user.avatarPath,
        row.user.vkData,
        this.uploadService,
      ),
      phone: row.user.phone,
      birthDate: row.user.birthDate,
      parents: row.user.parents.map((p) => this.toRelativeDto(p)),
      children: row.user.children.map((c) => this.toRelativeDto(c)),
      requestedBy,
      inviteId: row.inviteId,
      status: row.status,
      createdAt: row.createdAt,
      decidedAt: row.decidedAt,
    };
  }
}
