import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ROLE_RANK } from '@/common/guards/org-access';
import { paginatePrisma } from '@/common/prisma/prisma-paginate';
import { PaginationQueryDto } from '@/common/type';
import { ENTITY_EMOJI } from '@/common/utils';
import { OrgRole, Prisma } from '@/generated/prisma/client';
import { PrismaService } from 'prisma/prisma.service';

import { generateInviteToken } from '../invite/model/invite-code.util';
import { UploadService } from '../upload/upload.service';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import {
  OrganizationMemberDto,
  OrganizationResponseDto,
} from './dto/organization.response.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

const ORGANIZATION_SELECT = {
  id: true,
  name: true,
  active: true,
  settings: true,
  ownerUserId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrganizationSelect;

const MEMBER_SELECT = {
  role: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      email: true,
      name: true,
      lastName: true,
      avatarPath: true,
    },
  },
} satisfies Prisma.OrganizationMembershipSelect;

type MemberRow = Prisma.OrganizationMembershipGetPayload<{
  select: typeof MEMBER_SELECT;
}>;

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.organization} ${OrganizationService.name}`,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  // ── CRUD ────────────────────────────────────────────────────────────────

  /**
   * Список организаций. Обычный пользователь видит только свои действующие (где есть членство);
   * платформенный админ — все, включая мягко удалённые (ему их восстанавливать).
   */
  public async list(
    query: PaginationQueryDto,
    viewer: { userId: number; isPlatformAdmin: boolean },
  ) {
    const search = query.search?.trim();
    const where: Prisma.OrganizationWhereInput = {
      ...(viewer.isPlatformAdmin
        ? {}
        : { active: true, memberships: { some: { userId: viewer.userId } } }),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };

    const result = await paginatePrisma(this.prisma.organization, {
      ...query,
      where,
      select: ORGANIZATION_SELECT,
      sortable: ['id', 'createdAt', 'name'],
    });
    this.logger.log(`list viewer=${viewer.userId}: ${result.meta.total}`);
    return result;
  }

  /** Одна организация по id. Доступ проверяет OrgScopeGuard. */
  public async findById(id: number): Promise<OrganizationResponseDto> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      select: ORGANIZATION_SELECT,
    });
    if (!organization) {
      throw new NotFoundException('Организация не найдена');
    }
    this.logger.log(`findById id=${id}`);
    return organization;
  }

  /**
   * Создаёт организацию и делает вызывающего пользователя владельцем
   * (OrganizationMembership(OWNER) + денормализованный Organization.ownerUserId).
   * Self-serve: доступно любому авторизованному пользователю, организаций может быть несколько.
   */
  public async create(
    ownerUserId: number,
    dto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name.trim(),
        settings: (dto.settings ?? {}) as Prisma.InputJsonObject,
        ownerUserId,
        memberships: { create: { userId: ownerUserId, role: OrgRole.OWNER } },
        // Ссылка-приглашение нужна сразу — владелец не должен создавать её отдельным шагом
        invites: {
          create: {
            createdByUserId: ownerUserId,
            token: generateInviteToken(),
            expiresAt: null,
          },
        },
      },
      select: ORGANIZATION_SELECT,
    });

    this.logger.log(
      `Создана организация id=${organization.id} owner=${ownerUserId}`,
    );
    return organization;
  }

  /** Частичное обновление. Ключи settings, которых нет в dto, остаются как были. */
  public async update(
    id: number,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const data: Prisma.OrganizationUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();

    const organization = await this.prisma.$transaction(async (tx) => {
      if (dto.settings !== undefined) {
        // Слияние JSON требует прежнего значения — читаем его в той же транзакции
        const current = await tx.organization.findUnique({
          where: { id },
          select: { settings: true },
        });
        data.settings = {
          ...((current?.settings as Prisma.JsonObject | null) ?? {}),
          ...dto.settings,
        } as Prisma.InputJsonObject;
      }
      return this.updateOrNotFound(() =>
        tx.organization.update({
          where: { id },
          data,
          select: ORGANIZATION_SELECT,
        }),
      );
    });

    this.logger.log(`Обновлена организация id=${id}`);
    return organization;
  }

  /** Мягкое удаление (active=false). */
  public async delete(id: number): Promise<OrganizationResponseDto> {
    const organization = await this.updateOrNotFound(() =>
      this.prisma.organization.update({
        where: { id },
        data: { active: false },
        select: ORGANIZATION_SELECT,
      }),
    );
    this.logger.log(`Организация id=${id} деактивирована`);
    return organization;
  }

  /** Восстановление после мягкого удаления. */
  public async restore(id: number): Promise<OrganizationResponseDto> {
    const organization = await this.updateOrNotFound(() =>
      this.prisma.organization.update({
        where: { id },
        data: { active: true },
        select: ORGANIZATION_SELECT,
      }),
    );
    this.logger.log(`Организация id=${id} восстановлена`);
    return organization;
  }

  // ── Участники ───────────────────────────────────────────────────────────

  /** Состав организации. Доступ проверяет OrgScopeGuard; email видят только OWNER и ADMIN. */
  public async listMembers(
    organizationId: number,
    viewerRole: OrgRole | null,
  ): Promise<OrganizationMemberDto[]> {
    const canSeeEmail =
      viewerRole !== null && ROLE_RANK[viewerRole] >= ROLE_RANK[OrgRole.ADMIN];

    const memberships = await this.prisma.organizationMembership.findMany({
      where: { organizationId },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      select: MEMBER_SELECT,
    });

    this.logger.log(`listMembers org=${organizationId}: ${memberships.length}`);
    return memberships.map((m) => this.toMemberDto(m, canSeeEmail));
  }

  /**
   * Изменение роли / передача владения.
   * - `role: OWNER` — передача владения (только владелец): прежний владелец становится ADMIN.
   * - Владельца понизить нельзя — только через передачу владения другому.
   * - ADMIN не может менять роли других ADMIN и выдавать роль ADMIN.
   */
  public async updateMember(
    organizationId: number,
    userId: number,
    dto: UpdateMemberDto,
    callerRole: OrgRole,
  ): Promise<OrganizationMemberDto> {
    const membership = await this.prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: MEMBER_SELECT,
    });
    if (!membership) {
      throw new NotFoundException('У пользователя нет роли в этой организации');
    }

    if (dto.role === undefined || dto.role === membership.role) {
      return this.toMemberDto(membership, true);
    }

    if (membership.role === OrgRole.OWNER) {
      throw new ForbiddenException(
        'Понизить владельца нельзя — передайте владение другому участнику (role=OWNER)',
      );
    }
    if (
      callerRole !== OrgRole.OWNER &&
      (ROLE_RANK[membership.role] >= ROLE_RANK[callerRole] ||
        ROLE_RANK[dto.role] >= ROLE_RANK[callerRole])
    ) {
      throw new ForbiddenException('Недостаточно прав для смены этой роли');
    }

    if (dto.role === OrgRole.OWNER) {
      await this.transferOwnership(organizationId, userId);
    } else {
      await this.prisma.organizationMembership.update({
        where: { organizationId_userId: { organizationId, userId } },
        data: { role: dto.role },
      });
      this.logger.log(
        `Роль изменена org=${organizationId} userId=${userId} → ${dto.role}`,
      );
    }

    return this.toMemberDto({ ...membership, role: dto.role }, true);
  }

  /**
   * Удаление членства. Себя может удалить любой, кроме владельца; другого — только тот,
   * чья роль старше. Владельца удалить нельзя — сначала передача владения или удаление организации.
   */
  public async deleteMember(
    organizationId: number,
    userId: number,
    caller: { userId: number; role: OrgRole },
  ): Promise<{ removed: true }> {
    const isSelf = userId === caller.userId;
    // Чужое членство можно снять только с роли младше своей — условие сразу в where мутации
    const removableRoles = (Object.keys(ROLE_RANK) as OrgRole[]).filter(
      (role) =>
        role !== OrgRole.OWNER &&
        (isSelf || ROLE_RANK[role] < ROLE_RANK[caller.role]),
    );

    const { count } = await this.prisma.organizationMembership.deleteMany({
      where: { organizationId, userId, role: { in: removableRoles } },
    });
    if (count === 0) {
      throw new ForbiddenException(
        'Участник не найден или недостаточно прав для его удаления',
      );
    }

    this.logger.log(
      `Удалён участник org=${organizationId} userId=${userId} инициатор=${caller.userId}`,
    );
    return { removed: true };
  }

  // ── Вспомогательное ─────────────────────────────────────────────────────

  /** Передача владения: прежний владелец → ADMIN, новый → OWNER, денормализованный указатель обновлён. */
  private async transferOwnership(
    organizationId: number,
    newOwnerUserId: number,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.organizationMembership.updateMany({
        where: { organizationId, role: OrgRole.OWNER },
        data: { role: OrgRole.ADMIN },
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
      `Передача владения org=${organizationId} → userId=${newOwnerUserId}`,
    );
  }

  private toMemberDto(
    membership: MemberRow,
    withEmail: boolean,
  ): OrganizationMemberDto {
    return {
      userId: membership.user.id,
      email: withEmail ? membership.user.email : null,
      name: membership.user.name,
      lastName: membership.user.lastName,
      avatarUrl: this.uploadService.toPublicUrl(membership.user.avatarPath),
      role: membership.role,
      createdAt: membership.createdAt,
    };
  }

  /** Оборачивает мутацию: Prisma P2025 (запись не найдена) → понятный 404. */
  private async updateOrNotFound<T>(op: () => Promise<T>): Promise<T> {
    try {
      return await op();
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Организация не найдена');
      }
      throw e;
    }
  }
}
