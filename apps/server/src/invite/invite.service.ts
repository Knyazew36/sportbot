import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { paginatePrisma } from '@/common/prisma/prisma-paginate';
import { ENTITY_EMOJI } from '@/common/utils';
import { JoinRequestStatus, OrgRole, Prisma } from '@/generated/prisma/client';
import { NotificationEventKey } from '@/notifications/event-registry';
import {
  NotificationDeliveryParams,
  NotificationsService,
} from '@/notifications/notifications.service';
import { PrismaService } from 'prisma/prisma.service';

import { CreateInviteDto } from './dto/create-invite.dto';
import { InviteQueryDto } from './dto/invite-query.dto';
import {
  InviteResponseDto,
  RedeemPreviewDto,
  RedeemResultDto,
} from './dto/invite.response.dto';
import { RedeemInviteDto, RedeemQueryDto } from './dto/redeem-invite.dto';
import { isOrganizationAvailable } from '../common/organization/organization-availability';
import { generateInviteToken } from './model/invite-code.util';
import { UploadService } from '../upload/upload.service';

const INVITE_SELECT = {
  id: true,
  organizationId: true,
  token: true,
  createdByUserId: true,
  expiresAt: true,
  usedCount: true,
  createdAt: true,
} satisfies Prisma.InviteSelect;

const MAX_TOKEN_ATTEMPTS = 5;
/** Пауза перед повторной заявкой после отказа владельца. */
const REJECT_COOLDOWN_MS = 60 * 60 * 1000;

function formatUserName(user: {
  name: string | null;
  lastName: string | null;
}): string {
  return `${user.name ?? ''} ${user.lastName ?? ''}`.trim() || 'Пользователь';
}

@Injectable()
export class InviteService {
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.invite} ${InviteService.name}`,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── CRUD ────────────────────────────────────────────────────────────────

  /** Приглашения организации. organizationId — тот, доступ к которому проверил OrgScopeGuard. */
  public async list(organizationId: number, query: InviteQueryDto) {
    const where: Prisma.InviteWhereInput = { organizationId };
    const result = await paginatePrisma(this.prisma.invite, {
      ...query,
      where,
      select: INVITE_SELECT,
    });
    this.logger.log(`list org=${organizationId}: ${result.meta.total}`);
    return result;
  }

  /** Одно приглашение. Доступ проверяет ResourceScopeGuard (@ResourceScope('invite')). */
  public async findById(id: number): Promise<InviteResponseDto> {
    const invite = await this.prisma.invite.findUnique({
      where: { id },
      select: INVITE_SELECT,
    });
    if (!invite) {
      throw new NotFoundException('Приглашение не найдено');
    }
    this.logger.log(`findById id=${id}`);
    return invite;
  }

  /** Создаёт ссылку-приглашение. Организацию и права уже проверил OrgScopeGuard. */
  public async create(
    userId: number,
    organizationId: number,
    dto: CreateInviteDto,
  ): Promise<InviteResponseDto> {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    for (let attempt = 0; attempt < MAX_TOKEN_ATTEMPTS; attempt += 1) {
      try {
        const invite = await this.prisma.invite.create({
          data: {
            organizationId,
            createdByUserId: userId,
            token: generateInviteToken(),
            expiresAt,
          },
          select: INVITE_SELECT,
        });
        this.logger.log(
          `Создано приглашение id=${invite.id} org=${organizationId} createdBy=${userId}`,
        );
        return invite;
      } catch (error) {
        const isUniqueClash =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002';
        if (isUniqueClash && attempt < MAX_TOKEN_ATTEMPTS - 1) {
          continue;
        }
        throw error;
      }
    }
    throw new ConflictException(
      'Не удалось сгенерировать уникальный токен приглашения',
    );
  }

  /** Удалить ссылку (hard: ссылку проще создать заново, восстанавливать нечего). */
  public async delete(id: number): Promise<{ id: number }> {
    try {
      const invite = await this.prisma.invite.delete({
        where: { id },
        select: { id: true },
      });
      this.logger.log(`Удалено приглашение id=${invite.id}`);
      return { id: invite.id };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Приглашение не найдено');
      }
      throw e;
    }
  }

  /** Превью приглашения: какая организация и кто её владелец. */
  public async preview(query: RedeemQueryDto): Promise<RedeemPreviewDto> {
    const invite = await this.resolveActiveInvite(query.token);
    const { organization } = invite;

    this.logger.log(`preview invite=${invite.id}`);
    return {
      organizationId: invite.organizationId,
      organizationName: organization.name,
      ownerName: formatUserName(organization.owner),
      ownerAvatarUrl: this.uploadService.toPublicUrl(
        organization.owner.avatarPath,
      ),
    };
  }

  /**
   * Вступление по ссылке-приглашению: создаётся заявка, решение принимает владелец или админ
   * (см. JoinRequestModule).
   * Идемпотентно: уже участник → alreadyMember, уже есть PENDING-заявка → тот же joinRequestId.
   */
  public async redeem(
    userId: number,
    dto: RedeemInviteDto,
  ): Promise<RedeemResultDto> {
    const invite = await this.resolveActiveInvite(dto.token);
    const { organizationId } = invite;

    // Одним запросом: сам пользователь, его членство и заявки в этой организации
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        name: true,
        lastName: true,
        orgMemberships: {
          where: { organizationId },
          select: { role: true },
        },
        joinRequests: {
          where: {
            organizationId,
            OR: [
              { status: JoinRequestStatus.PENDING },
              {
                status: JoinRequestStatus.REJECTED,
                decidedAt: { gte: new Date(Date.now() - REJECT_COOLDOWN_MS) },
              },
            ],
          },
          select: { id: true, status: true },
        },
      },
    });

    const membership = user.orgMemberships[0];
    if (membership) {
      this.logger.log(
        `redeem invite=${invite.id}: уже участник userId=${userId}`,
      );
      return {
        organizationId,
        alreadyMember: true,
        pending: false,
        role: membership.role,
        joinRequestId: null,
      };
    }

    const pending = user.joinRequests.find(
      (r) => r.status === JoinRequestStatus.PENDING,
    );
    if (pending) {
      this.logger.log(
        `redeem invite=${invite.id}: уже есть заявка id=${pending.id}`,
      );
      return {
        organizationId,
        alreadyMember: false,
        pending: true,
        role: null,
        joinRequestId: pending.id,
      };
    }
    if (user.joinRequests.length > 0) {
      throw new ConflictException(
        'Заявку в эту организацию недавно отклонили. Попробуйте позже',
      );
    }

    const joinRequest = await this.prisma.joinRequest.create({
      data: {
        organizationId,
        userId,
        inviteId: invite.id,
        status: JoinRequestStatus.PENDING,
      },
      select: { id: true },
    });

    this.logger.log(
      `Создана заявка id=${joinRequest.id} по приглашению=${invite.id} userId=${userId}`,
    );
    await this.notifyManagers('JOIN_REQUEST_CREATED', organizationId, {
      title: 'Новая заявка на вступление',
      body: `${formatUserName(user)} хочет вступить в «${invite.organization.name}»`,
      payload: { joinRequestId: joinRequest.id },
    });

    return {
      organizationId,
      alreadyMember: false,
      pending: true,
      role: null,
      joinRequestId: joinRequest.id,
    };
  }

  // ── Вспомогательное ─────────────────────────────────────────────────────

  /** Уведомляет владельца и админов. Сбой доставки не должен рушить вступление. */
  private async notifyManagers(
    eventKey: NotificationEventKey,
    organizationId: number,
    params: NotificationDeliveryParams,
  ): Promise<void> {
    try {
      await this.notifications.notifyOrganization(eventKey, {
        organizationId,
        roles: [OrgRole.OWNER, OrgRole.ADMIN],
        ...params,
      });
    } catch (error) {
      this.logger.error(
        `Не удалось отправить ${eventKey} org=${organizationId}: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async resolveActiveInvite(token: string) {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      throw new BadRequestException('Нужен токен приглашения');
    }

    const invite = await this.prisma.invite.findUnique({
      where: { token: trimmedToken },
      select: {
        id: true,
        organizationId: true,
        expiresAt: true,
        organization: {
          select: {
            name: true,
            active: true,
            owner: {
              select: {
                name: true,
                lastName: true,
                avatarPath: true,
              },
            },
          },
        },
      },
    });
    if (!invite) {
      throw new NotFoundException('Приглашение не найдено');
    }
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      throw new GoneException('Срок приглашения истёк');
    }
    if (!isOrganizationAvailable(invite.organization)) {
      throw new ForbiddenException('Организация недоступна');
    }
    return invite;
  }
}
