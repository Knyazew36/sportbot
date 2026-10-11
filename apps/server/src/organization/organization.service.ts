import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { paginatePrisma } from '@/common/prisma/prisma-paginate';
import { PaginationQueryDto } from '@/common/type';
import { ENTITY_EMOJI } from '@/common/utils';
import {
  resolveAvatarUrl,
  resolveVkName,
} from '@/common/vk/resolve-vk-profile';
import { JoinRequestStatus, OrgRole, Prisma } from '@/generated/prisma/client';
import { PrismaService } from 'prisma/prisma.service';

import { isOrganizationAvailable, ORGANIZATION_AVAILABILITY_SELECT } from '../common/organization/organization-availability';
import { ORGANIZATION_TRIAL_DAYS } from '../common/billing/pricing.constants';
import { generateInviteToken } from '../invite/model/invite-code.util';
import { VkService } from '../vk/vk.service';
import { UploadService } from '../upload/upload.service';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { DeleteMemberDto } from './dto/delete-member.dto';
import { JoinOrganizationDto } from './dto/join-organization.dto';
import {
  OrganizationMemberDto,
  OrganizationResponseDto,
} from './dto/organization.response.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { OrganizationSettingsDto } from './dto/organization-settings.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

/** Рабочее время по умолчанию для нового кружка, если не задано явно. */
const DEFAULT_WORK_HOURS = { start: 8, end: 22 };
/** Пауза перед повторной заявкой после отказа владельца. */
const REJECT_COOLDOWN_MS = 60 * 60 * 1000;

const ORGANIZATION_SELECT = {
  id: true,
  name: true,
  active: true,
  isOpen: true,
  settings: true,
  ownerUserId: true,
  trialEndsAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrganizationSelect;

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly vkService: VkService,
  ) {}

  // ---------- CRUD ----------

  /**
   * Список кружков. Обычный пользователь видит только свои (где есть членство);
   * платформенный админ — все.
   */
  public async list(
    query: PaginationQueryDto,
    viewer: { userId: number; isPlatformAdmin: boolean },
  ) {
    const search = query.search?.trim();
    const where: Prisma.OrganizationWhereInput = {
      ...(viewer.isPlatformAdmin
        ? {}
        : { memberships: { some: { userId: viewer.userId } } }),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };

    const result = await paginatePrisma(this.prisma.organization, {
      ...query,
      where,
      select: ORGANIZATION_SELECT,
    });
    this.logger.log(
      `${ENTITY_EMOJI.organization} list viewer=${viewer.userId}: ${result.meta.total}`,
    );
    return result;
  }

  /** Один кружок по id. Доступ проверяет OrgScopeGuard. */
  public async findById(id: number): Promise<OrganizationResponseDto> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      select: ORGANIZATION_SELECT,
    });
    if (!organization) {
      throw new NotFoundException('Кружок не найден');
    }
    this.logger.log(`${ENTITY_EMOJI.organization} findById id=${id}`);
    return organization;
  }

  /**
   * Создаёт кружок и делает вызывающего пользователя владельцем
   * (OrganizationMembership(OWNER) + денормализованный Organization.ownerUserId).
   * Self-serve: доступно любому авторизованному пользователю, один пользователь
   * может иметь несколько кружков.
   */
  public async create(
    ownerUserId: number,
    dto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    this.assertSettings(dto.settings);
    const organization = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.name.trim(),
          isOpen: dto.isOpen ?? false,
          trialEndsAt: new Date(Date.now() + ORGANIZATION_TRIAL_DAYS * 24 * 60 * 60 * 1000),
          settings: {
            workHours: DEFAULT_WORK_HOURS,
            ...dto.settings,
          } as unknown as Prisma.InputJsonObject,
          ownerUserId,
        },
        select: ORGANIZATION_SELECT,
      });

      await tx.organizationMembership.create({
        data: {
          organizationId: organization.id,
          userId: ownerUserId,
          role: OrgRole.OWNER,
        },
      });

      // Ссылка-приглашение нужна сразу — владелец не должен создавать её отдельным шагом.
      await tx.invite.create({
        data: {
          organizationId: organization.id,
          createdByUserId: ownerUserId,
          token: generateInviteToken(),
          expiresAt: null,
        },
      });

      return organization;
    });

    this.logger.log(
      `${ENTITY_EMOJI.organization} Создан кружок id=${organization.id} owner=${ownerUserId}`,
    );
    return organization;
  }

  /** Частичное обновление (сейчас — только название). */
  public async update(
    id: number,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const current = await this.prisma.organization.findUnique({
      where: { id },
      select: { settings: true },
    });
    if (!current) throw new NotFoundException('Кружок не найден');
    const data: Prisma.OrganizationUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.isOpen !== undefined) data.isOpen = dto.isOpen;
    if (dto.settings !== undefined) {
      this.assertSettings(dto.settings);
      // Ключи, которых нет в dto, остаются как были — настройки будут расширяться.
      data.settings = {
        ...(current.settings as Prisma.JsonObject),
        ...dto.settings,
      } as Prisma.InputJsonObject;
    }
    return this.prisma.organization.update({
      where: { id },
      data,
      select: ORGANIZATION_SELECT,
    });
  }

  /** Мягкое удаление (active=false). Участникам с разрешёнными VK-сообщениями уходит уведомление. */
  public async delete(id: number): Promise<OrganizationResponseDto> {
    await this.assertExists(id);
    const organization = await this.prisma.organization.update({
      where: { id },
      data: { active: false },
      select: ORGANIZATION_SELECT,
    });
    this.logger.log(
      `${ENTITY_EMOJI.organization} Кружок id=${id} деактивирован`,
    );
    await this.notifyMembersClosed(id, organization.name);
    return organization;
  }

  /** Восстановление после мягкого удаления. */
  public async restore(id: number): Promise<OrganizationResponseDto> {
    await this.assertExists(id);
    const organization = await this.prisma.organization.update({
      where: { id },
      data: { active: true },
      select: ORGANIZATION_SELECT,
    });
    this.logger.log(
      `${ENTITY_EMOJI.organization} Кружок id=${id} восстановлен`,
    );
    return organization;
  }

  /**
   * Вступление в открытую организацию без приглашения (`Organization.isOpen=true`).
   * Закрытую организацию так не пройти — только через `Invite`.
   */
  public async join(
    organizationId: number,
    callerUserId: number,
    dto: JoinOrganizationDto,
  ): Promise<OrganizationMemberDto> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { isOpen: true, ...ORGANIZATION_AVAILABILITY_SELECT },
    });
    if (!organization) {
      throw new NotFoundException('Кружок не найден');
    }
    if (!isOrganizationAvailable(organization)) {
      throw new NotFoundException('Кружок недоступен');
    }
    if (!organization.isOpen) {
      throw new ForbiddenException('Организация закрыта — нужно приглашение');
    }

    const userId = await this.resolveSubjectUserId(
      callerUserId,
      dto.childUserId,
    );

    const existing = await this.prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (existing) {
      throw new ConflictException('Уже состоит в этой организации');
    }

    // Ребёнок вступает вместе с родителем — иначе родитель не увидит кружок и расписание ребёнка.
    const memberIds =
      userId === callerUserId ? [userId] : [userId, callerUserId];
    await this.prisma.organizationMembership.createMany({
      data: memberIds.map((memberId) => ({
        organizationId,
        userId: memberId,
        role: OrgRole.MEMBER,
      })),
      skipDuplicates: true,
    });
    this.logger.log(
      `${ENTITY_EMOJI.organization} Вступление org=${organizationId} userId=${userId} инициатор=${callerUserId}`,
    );

    return this.toMemberDto(organizationId, userId);
  }

  /**
   * Родитель подаёт заявку за своего ребёнка в кружок (кнопка «Пригласить в кружок»).
   * Открытый кружок — ребёнок (и родитель, если его ещё нет) вступает сразу.
   * Закрытый — создаётся PENDING-заявка, решает владелец. Повторная заявка после отказа — через 1 час.
   */
  public async requestForChild(
    organizationId: number,
    childId: number,
    callerUserId: number,
  ): Promise<{ joined: boolean; joinRequestId: number | null }> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { isOpen: true, ...ORGANIZATION_AVAILABILITY_SELECT },
    });
    if (!organization) {
      throw new NotFoundException('Кружок не найден');
    }
    if (!isOrganizationAvailable(organization)) {
      throw new NotFoundException('Кружок недоступен');
    }

    const child = await this.prisma.user.findFirst({
      where: { id: childId, parents: { some: { id: callerUserId } } },
      select: { id: true },
    });
    if (!child) {
      throw new NotFoundException('Ребёнок не найден');
    }

    const alreadyMember = await this.prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId, userId: child.id } },
      select: { userId: true },
    });
    if (alreadyMember) {
      throw new ConflictException('Ребёнок уже в этом кружке');
    }

    if (organization.isOpen) {
      const memberIds = [child.id, callerUserId];
      await this.prisma.organizationMembership.createMany({
        data: memberIds.map((userId) => ({
          organizationId,
          userId,
          role: OrgRole.MEMBER,
        })),
        skipDuplicates: true,
      });
      this.logger.log(
        `${ENTITY_EMOJI.organization} Ребёнок вступил в открытый org=${organizationId} childId=${child.id}`,
      );
      return { joined: true, joinRequestId: null };
    }

    const pending = await this.prisma.joinRequest.findFirst({
      where: { organizationId, userId: child.id, status: JoinRequestStatus.PENDING },
      select: { id: true },
    });
    if (pending) {
      return { joined: false, joinRequestId: pending.id };
    }

    const lastRejected = await this.prisma.joinRequest.findFirst({
      where: {
        organizationId,
        userId: child.id,
        status: JoinRequestStatus.REJECTED,
        decidedAt: { gte: new Date(Date.now() - REJECT_COOLDOWN_MS) },
      },
      select: { id: true },
    });
    if (lastRejected) {
      throw new ConflictException('Заявку в этот кружок недавно отправляли. Попробуйте позже');
    }

    const request = await this.prisma.joinRequest.create({
      data: {
        organizationId,
        userId: child.id,
        requestedByUserId: callerUserId,
        status: JoinRequestStatus.PENDING,
      },
      select: { id: true },
    });
    this.logger.log(
      `${ENTITY_EMOJI.organization} Заявка за ребёнка id=${request.id} org=${organizationId} childId=${child.id}`,
    );
    return { joined: false, joinRequestId: request.id };
  }

  // ---------- Члены организации (OrganizationMembership) ----------

  /** Состав Доступ проверяет OrgScopeGuard. */
  public async listMembers(
    organizationId: number,
    viewerRole: OrgRole | null,
  ): Promise<OrganizationMemberDto[]> {
    const canSeeEmail = viewerRole === OrgRole.OWNER;
    await this.assertExists(organizationId);

    const memberships = await this.prisma.organizationMembership.findMany({
      where: { organizationId },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      select: {
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            lastName: true,
            avatarPath: true,
            vkData: true,
            children: {
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                name: true,
                lastName: true,
                birthDate: true,
                avatarPath: true,
                vkData: true,
              },
            },
          },
        },
      },
    });

    // Показываем только детей, которые реально в кружке: ребёнок-член вложен у родителя-члена,
    // а не отдельной строкой. Неподключённые дети родителя в состав не попадают.
    const memberIds = new Set(memberships.map((m) => m.user.id));
    const childIds = new Set(
      memberships.flatMap((m) =>
        m.user.children.filter((c) => memberIds.has(c.id)).map((c) => c.id),
      ),
    );

    this.logger.log(
      `${ENTITY_EMOJI.organization} listMembers org=${organizationId}: ${memberships.length}`,
    );
    return memberships
      .filter((m) => !childIds.has(m.user.id))
      .map((m) => ({
        userId: m.user.id,
        email: canSeeEmail ? m.user.email : null,
        ...resolveVkName(m.user.name, m.user.lastName, m.user.vkData),
        avatarUrl: resolveAvatarUrl(
          m.user.avatarPath,
          m.user.vkData,
          this.uploadService,
        ),
        role: m.role,
        createdAt: m.createdAt,
        children: m.user.children
          .filter((c) => memberIds.has(c.id))
          .map((c) => ({
          userId: c.id,
          ...resolveVkName(c.name, c.lastName, c.vkData),
          birthDate: c.birthDate,
          avatarUrl: resolveAvatarUrl(
            c.avatarPath,
            c.vkData,
            this.uploadService,
          ),
        })),
      }));
  }

  /**
   * Изменение роли / передача владения.
   * - `role: OWNER` — передача владения: текущий владелец → MEMBER, `Organization.ownerUserId` переписывается.
   * - `role: MEMBER` для действующего владельца — запрещено (только через передачу владения другому).
   */
  public async updateMember(
    organizationId: number,
    userId: number,
    dto: UpdateMemberDto,
  ): Promise<OrganizationMemberDto> {
    const membership = await this.prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!membership) {
      throw new NotFoundException('У пользователя нет роли в этой организации');
    }

    if (dto.role === undefined || dto.role === membership.role) {
      return this.toMemberDto(organizationId, userId);
    }

    if (dto.role === OrgRole.MEMBER && membership.role === OrgRole.OWNER) {
      throw new ForbiddenException(
        'Понизить владельца нельзя — передайте владение другому участнику (role=OWNER)',
      );
    }

    if (dto.role === OrgRole.OWNER) {
      await this.transferOwnership(organizationId, userId);
    } else {
      await this.prisma.organizationMembership.update({
        where: { organizationId_userId: { organizationId, userId } },
        data: { role: dto.role },
      });
      this.logger.log(
        `${ENTITY_EMOJI.organization} Роль изменена org=${organizationId} userId=${userId} → ${dto.role}`,
      );
    }

    return this.toMemberDto(organizationId, userId);
  }

  /**
   * Удаление членства. Кто может:
   * - владелец — любого, кроме владельца;
   * - участник — только себя (`removeChildren` — заодно своих детей);
   * - родитель — своего ребёнка (ребёнок обязан быть `children` звонящего).
   * Владельца удалить нельзя — сначала передача владения или удаление кружка.
   * Вместе с членством снимаются группы и отметки на занятиях в этом кружке.
   */
  public async deleteMember(
    organizationId: number,
    userId: number,
    callerId: number,
    dto: DeleteMemberDto = {},
  ): Promise<{ removed: true; removedUserIds: number[] }> {
    const membership = await this.prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!membership) {
      throw new NotFoundException('У пользователя нет роли в этой организации');
    }
    if (membership.role === OrgRole.OWNER) {
      throw new ForbiddenException('Нельзя удалить владельца организации');
    }

    const removedUserIds = [userId];
    if (userId !== callerId) {
      const callerMembership = await this.prisma.organizationMembership.findUnique({
        where: { organizationId_userId: { organizationId, userId: callerId } },
      });
      const isOwner = callerMembership?.role === OrgRole.OWNER;
      const isOwnChild = !isOwner
        ? !!(await this.prisma.user.findFirst({
            where: { id: userId, parents: { some: { id: callerId } } },
            select: { id: true },
          }))
        : false;
      if (!isOwner && !isOwnChild) {
        throw new ForbiddenException('Удалить другого участника может только владелец или родитель');
      }
    } else if (dto.removeChildren) {
      const children = await this.prisma.organizationMembership.findMany({
        where: {
          organizationId,
          user: { parents: { some: { id: callerId } } },
        },
        select: { userId: true },
      });
      removedUserIds.push(...children.map((c) => c.userId));
    }

    await this.prisma.$transaction([
      this.prisma.lessonAttendance.deleteMany({
        where: { organizationId, userId: { in: removedUserIds } },
      }),
      this.prisma.groupMembership.deleteMany({
        where: { organizationId, userId: { in: removedUserIds } },
      }),
      this.prisma.organizationMembership.deleteMany({
        where: { organizationId, userId: { in: removedUserIds }, role: OrgRole.MEMBER },
      }),
    ]);

    this.logger.log(
      `${ENTITY_EMOJI.organization} Удалены участники org=${organizationId} userIds=${removedUserIds.join(',')} инициатор=${callerId}`,
    );
    return { removed: true, removedUserIds };
  }

  // ---------- helpers ----------

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

  /** Передача владения: старый владелец → MEMBER, новый → OWNER, денормализованный указатель обновлён. */
  private async transferOwnership(
    organizationId: number,
    newOwnerUserId: number,
  ): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerUserId: true },
    });
    if (!organization) {
      throw new NotFoundException('Кружок не найден');
    }

    await this.prisma.$transaction([
      this.prisma.organizationMembership.update({
        where: {
          organizationId_userId: {
            organizationId,
            userId: organization.ownerUserId,
          },
        },
        data: { role: OrgRole.MEMBER },
      }),
      this.prisma.organizationMembership.update({
        where: {
          organizationId_userId: { organizationId, userId: newOwnerUserId },
        },
        data: { role: OrgRole.OWNER },
      }),
      this.prisma.organization.update({
        where: { id: organizationId },
        data: { ownerUserId: newOwnerUserId },
      }),
    ]);

    this.logger.log(
      `${ENTITY_EMOJI.organization} Передача владения org=${organizationId}: ${organization.ownerUserId} → ${newOwnerUserId}`,
    );
  }

  private async toMemberDto(
    organizationId: number,
    userId: number,
  ): Promise<OrganizationMemberDto> {
    const membership =
      await this.prisma.organizationMembership.findUniqueOrThrow({
        where: { organizationId_userId: { organizationId, userId } },
        select: {
          role: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              lastName: true,
              avatarPath: true,
              vkData: true,
            },
          },
        },
      });

    return {
      userId: membership.user.id,
      email: membership.user.email,
      ...resolveVkName(
        membership.user.name,
        membership.user.lastName,
        membership.user.vkData,
      ),
      avatarUrl: resolveAvatarUrl(
        membership.user.avatarPath,
        membership.user.vkData,
        this.uploadService,
      ),
      role: membership.role,
      createdAt: membership.createdAt,
    };
  }

  /** Сообщает участникам в VK, что кружок закрыт. Ошибка одной отправки не валит удаление. */
  private async notifyMembersClosed(
    organizationId: number,
    organizationName: string,
  ): Promise<void> {
    const members = await this.prisma.organizationMembership.findMany({
      where: {
        organizationId,
        user: { vkUserId: { not: null }, vkMessagesAllowed: true },
      },
      select: { user: { select: { vkUserId: true } } },
    });
    const text = `Кружок «${organizationName}» закрыт владельцем. Записи и расписание больше недоступны.`;
    const results = await Promise.allSettled(
      members.map((m) => this.vkService.sendMessage(m.user.vkUserId as bigint, text)),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    this.logger.log(
      `${ENTITY_EMOJI.organization} Уведомлено о закрытии org=${organizationId}: ${members.length - failed}/${members.length}`,
    );
  }

  private async assertExists(id: number): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!organization) {
      throw new NotFoundException('Кружок не найден');
    }
  }

  private assertSettings(settings: OrganizationSettingsDto | undefined): void {
    const hours = settings?.workHours;
    if (hours && hours.end <= hours.start) {
      throw new BadRequestException(
        'Конец рабочего дня должен быть позже начала',
      );
    }
  }
}
