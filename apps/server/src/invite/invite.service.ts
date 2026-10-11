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
import {
  resolveAvatarUrl,
  resolveVkName,
} from '@/common/vk/resolve-vk-profile';
import { JoinRequestStatus, OrgRole, Prisma } from '@/generated/prisma/client';
import { NotificationsService } from '@/notifications/notifications.service';
import { PrismaService } from 'prisma/prisma.service';

import { CreateInviteDto } from './dto/create-invite.dto';
import { InviteQueryDto } from './dto/invite-query.dto';
import {
  InviteResponseDto,
  RedeemPreviewDto,
  RedeemResultDto,
} from './dto/invite.response.dto';
import { RedeemInviteDto, RedeemQueryDto } from './dto/redeem-invite.dto';
import { isOrganizationAvailable, ORGANIZATION_AVAILABILITY_SELECT } from '../common/organization/organization-availability';
import { generateInviteToken } from './model/invite-code.util';
import { UploadService } from '../upload/upload.service';
import { VkService } from '../vk/vk.service';

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
  displayName: string | null;
}): string {
  return (
    user.displayName?.trim() ||
    `${user.name ?? ''} ${user.lastName ?? ''}`.trim() ||
    'Педагог'
  );
}

@Injectable()
export class InviteService {
  private readonly logger = new Logger(InviteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly vkService: VkService,
    private readonly notifications: NotificationsService,
  ) {}

  // ---------- CRUD ----------

  /** Приглашения организации. Доступ проверяет OrgScopeGuard (по query.organizationId). */
  public async list(query: InviteQueryDto) {
    const where: Prisma.InviteWhereInput = {
      organizationId: query.organizationId,
    };
    const result = await paginatePrisma(this.prisma.invite, {
      ...query,
      where,
      select: INVITE_SELECT,
    });
    this.logger.log(
      `${ENTITY_EMOJI.invite} list org=${query.organizationId}: ${result.meta.total}`,
    );
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
    this.logger.log(`${ENTITY_EMOJI.invite} findById id=${id}`);
    return invite;
  }

  /** Создаёт ссылку-приглашение организации. */
  public async create(
    userId: number,
    dto: CreateInviteDto,
  ): Promise<InviteResponseDto> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
      select: { id: true },
    });
    if (!organization) {
      throw new NotFoundException('Организация не найдена');
    }

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    for (let attempt = 0; attempt < MAX_TOKEN_ATTEMPTS; attempt += 1) {
      try {
        const invite = await this.prisma.invite.create({
          data: {
            organizationId: dto.organizationId,
            createdByUserId: userId,
            token: generateInviteToken(),
            expiresAt,
          },
          select: INVITE_SELECT,
        });
        this.logger.log(
          `${ENTITY_EMOJI.invite} Создано приглашение id=${invite.id} org=${dto.organizationId} createdBy=${userId}`,
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

  /** Удалить ссылку (hard, ссылки одноразово-настраиваемые — восстанавливать нечего). */
  public async delete(id: number): Promise<{ id: number }> {
    await this.assertExists(id);
    const invite = await this.prisma.invite.delete({
      where: { id },
      select: { id: true },
    });
    this.logger.log(
      `${ENTITY_EMOJI.invite} Удалено приглашение id=${invite.id}`,
    );
    return { id: invite.id };
  }

  /** Превью приглашения: какая организация и чей это кружок по ссылке. */
  public async preview(query: RedeemQueryDto): Promise<RedeemPreviewDto> {
    const invite = await this.resolveActiveInvite(query.token);

    const organization = await this.prisma.organization.findUnique({
      where: { id: invite.organizationId },
      select: {
        id: true,
        name: true,
        owner: {
          select: {
            name: true,
            lastName: true,
            displayName: true,
            avatarPath: true,
            vkData: true,
          },
        },
      },
    });
    if (!organization) {
      throw new NotFoundException('Организация не найдена');
    }

    const ownerName = resolveVkName(
      organization.owner.name,
      organization.owner.lastName,
      organization.owner.vkData,
    );

    this.logger.log(`${ENTITY_EMOJI.invite} preview invite=${invite.id}`);
    return {
      organizationId: organization.id,
      organizationName: organization.name,
      ownerName: formatUserName({ ...organization.owner, ...ownerName }),
      ownerAvatarUrl: resolveAvatarUrl(
        organization.owner.avatarPath,
        organization.owner.vkData,
        this.uploadService,
      ),
    };
  }

  /**
   * Заявка на вступление в организацию по ссылке-приглашению. Членом организации
   * заявитель не становится сразу — решение принимает владелец (см. JoinRequestModule).
   * Идемпотентно: уже участник → alreadyMember, уже есть PENDING-заявка → тот же joinRequestId.
   */
  public async redeem(
    callerUserId: number,
    dto: RedeemInviteDto,
  ): Promise<RedeemResultDto> {
    const invite = await this.resolveActiveInvite(dto.token);
    const subjectUserId = await this.resolveSubjectUserId(
      callerUserId,
      dto.childUserId,
    );

    const existingMembership =
      await this.prisma.organizationMembership.findUnique({
        where: {
          organizationId_userId: {
            organizationId: invite.organizationId,
            userId: subjectUserId,
          },
        },
      });
    if (existingMembership) {
      this.logger.log(
        `${ENTITY_EMOJI.invite} redeem invite=${invite.id}: уже участник userId=${subjectUserId}`,
      );
      return {
        organizationId: invite.organizationId,
        alreadyMember: true,
        pending: false,
        role: existingMembership.role,
        joinRequestId: null,
      };
    }

    // Открытый кружок: ссылка сразу даёт членство, без заявки владельцу.
    if (invite.organization.isOpen) {
      const memberIds = [
        subjectUserId,
        ...(callerUserId !== subjectUserId ? [callerUserId] : []),
      ];
      const [, , user] = await this.prisma.$transaction([
        this.prisma.organizationMembership.createMany({
          data: memberIds.map((userId) => ({
            organizationId: invite.organizationId,
            userId,
            role: OrgRole.MEMBER,
          })),
          skipDuplicates: true,
        }),
        this.prisma.invite.update({
          where: { id: invite.id },
          data: { usedCount: { increment: 1 } },
        }),
        this.prisma.user.findUniqueOrThrow({
          where: { id: subjectUserId },
          select: { name: true, lastName: true, displayName: true },
        }),
      ]);
      this.logger.log(
        `${ENTITY_EMOJI.invite} redeem invite=${invite.id}: открытый кружок, вступление userId=${subjectUserId}`,
      );
      await this.notifyOwnersOfNewMember(invite.organizationId, user);
      return {
        organizationId: invite.organizationId,
        alreadyMember: false,
        pending: false,
        role: OrgRole.MEMBER,
        joinRequestId: null,
      };
    }

    const lastRejected = await this.prisma.joinRequest.findFirst({
      where: {
        organizationId: invite.organizationId,
        userId: subjectUserId,
        status: JoinRequestStatus.REJECTED,
        decidedAt: { gte: new Date(Date.now() - REJECT_COOLDOWN_MS) },
      },
      select: { decidedAt: true },
    });
    if (lastRejected) {
      throw new ConflictException(
        'Заявку в этот кружок недавно отправляли. Попробуйте позже',
      );
    }

    const existingPending = await this.prisma.joinRequest.findFirst({
      where: {
        organizationId: invite.organizationId,
        userId: subjectUserId,
        status: JoinRequestStatus.PENDING,
      },
      select: { id: true },
    });
    if (existingPending) {
      this.logger.log(
        `${ENTITY_EMOJI.invite} redeem invite=${invite.id}: уже есть заявка id=${existingPending.id}`,
      );
      return {
        organizationId: invite.organizationId,
        alreadyMember: false,
        pending: true,
        role: null,
        joinRequestId: existingPending.id,
      };
    }

    const joinRequest = await this.prisma.joinRequest.create({
      data: {
        organizationId: invite.organizationId,
        userId: subjectUserId,
        requestedByUserId: callerUserId,
        inviteId: invite.id,
        status: JoinRequestStatus.PENDING,
      },
      select: { id: true },
    });

    this.logger.log(
      `${ENTITY_EMOJI.invite} Создана заявка id=${joinRequest.id} по приглашению=${invite.id} userId=${subjectUserId}`,
    );
    await this.notifyOwnerOfNewJoinRequest(invite.organizationId, callerUserId);

    return {
      organizationId: invite.organizationId,
      alreadyMember: false,
      pending: true,
      role: null,
      joinRequestId: joinRequest.id,
    };
  }

  /** Уведомляет владельцев организации о новом участнике. Сбой доставки не должен рушить вступление. */
  private async notifyOwnersOfNewMember(
    organizationId: number,
    user: { name: string | null; lastName: string | null; displayName: string | null },
  ): Promise<void> {
    try {
      await this.notifications.notifyOrganization('ORG_MEMBER_JOINED', {
        organizationId,
        roles: [OrgRole.OWNER],
        title: 'Новый участник организации',
        body: `${formatUserName(user)} присоединился к вашей организации`,
      });
    } catch (error) {
      this.logger.error('Не удалось отправить уведомление о новом участнике', error);
    }
  }

  // ---------- helpers ----------

  /** Сообщает владельцу кружка в VK о новой заявке. Ошибка отправки не должна ронять redeem(). */
  private async notifyOwnerOfNewJoinRequest(
    organizationId: number,
    requestedByUserId: number,
  ): Promise<void> {
    this.logger.log(
      `${ENTITY_EMOJI.invite} notifyOwnerOfNewJoinRequest org=${organizationId} requestedBy=${requestedByUserId}`,
    );
    const [organization, requester] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          name: true,
          owner: {
            select: {
              vkUserId: true,
              vkMessagesAllowed: true,
              name: true,
              lastName: true,
              displayName: true,
              vkData: true,
            },
          },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: requestedByUserId },
        select: { name: true, lastName: true, displayName: true, vkData: true },
      }),
    ]);
    if (
      !organization?.owner.vkUserId ||
      !organization.owner.vkMessagesAllowed
    ) {
      this.logger.log(
        `${ENTITY_EMOJI.invite} Нет VK-адресата у владельца org=${organizationId}, уведомление о заявке не отправлено`,
      );
      return;
    }

    const requesterName = requester
      ? formatUserName({
          ...requester,
          ...resolveVkName(
            requester.name,
            requester.lastName,
            requester.vkData,
          ),
        })
      : 'Пользователь';

    try {
      await this.vkService.sendMessage(
        organization.owner.vkUserId,
        `Новая заявка на вступление в «${organization.name}» от ${requesterName}`,
      );
      this.logger.log(
        `${ENTITY_EMOJI.invite} Уведомление о заявке отправлено владельцу org=${organizationId}`,
      );
    } catch (error) {
      this.logger.warn(
        `${ENTITY_EMOJI.invite} Не удалось уведомить владельца org=${organizationId} о заявке: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /** Если указан childUserId — проверяет, что это ребёнок звонящего, и вступает он, а не родитель. */
  private async resolveSubjectUserId(
    callerUserId: number,
    childUserId: number | undefined,
  ): Promise<number> {
    if (childUserId === undefined) return callerUserId;

    const child = await this.prisma.user.findFirst({
      where: { id: childUserId, parents: { some: { id: callerUserId } } },
      select: { id: true },
    });
    if (!child) {
      throw new NotFoundException('Ребёнок не найден');
    }
    return child.id;
  }

  private async resolveActiveInvite(token: string) {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      throw new BadRequestException('Нужен токен приглашения');
    }

    const invite = await this.prisma.invite.findFirst({
      where: { token: trimmedToken },
      select: {
        id: true,
        organizationId: true,
        expiresAt: true,
        organization: {
          select: { isOpen: true, ...ORGANIZATION_AVAILABILITY_SELECT },
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
      throw new ForbiddenException('Кружок недоступен');
    }
    return invite;
  }

  private async assertExists(id: number): Promise<void> {
    const found = await this.prisma.invite.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException('Приглашение не найдено');
    }
  }
}
