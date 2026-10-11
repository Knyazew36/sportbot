import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { ENTITY_EMOJI } from '@/common/utils';
import { OrgRole } from '@/generated/prisma/client';
import { PrismaService } from 'prisma/prisma.service';

import { UploadService } from '../upload/upload.service';

import { UserCapabilities, UserContext } from './types/user-context';

/**
 * Источник ролевого контекста пользователя. Доменной роли на аккаунте нет —
 * роль выводится из OrganizationMembership, «платформенный админ» = User.isPlatformAdmin.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.auth} ${AuthService.name}`,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  /** Одним запросом собирает все ролевые связи пользователя. */
  public async getUserContext(userId: number): Promise<UserContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isPlatformAdmin: true,
        orgMemberships: {
          where: { organization: { active: true } },
          select: { organizationId: true, role: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    this.logger.log(`getUserContext userId=${userId}`);
    return {
      userId: user.id,
      isPlatformAdmin: user.isPlatformAdmin,
      orgMemberships: user.orgMemberships,
    };
  }

  /** Возможности для GET /me. Вычисляются на каждый запрос, в БД не хранятся. */
  public computeCapabilities(context: UserContext): UserCapabilities {
    return {
      isPlatformAdmin: context.isPlatformAdmin,
      isOrgOwner: context.orgMemberships.some((m) => m.role === OrgRole.OWNER),
      isOrgAdmin: context.orgMemberships.some(
        (m) => m.role === OrgRole.OWNER || m.role === OrgRole.ADMIN,
      ),
      isOrgMember: context.orgMemberships.length > 0,
    };
  }

  /** Шорткат: контекст + возможности за один проход. */
  public async getCapabilities(userId: number): Promise<UserCapabilities> {
    return this.computeCapabilities(await this.getUserContext(userId));
  }

  /** Профиль + вычисленные capabilities для GET /auth/me и GET /me. */
  public async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true,
        lastName: true,
        avatarPath: true,
        phone: true,
        isPlatformAdmin: true,
        vkId: true,
        telegramId: true,
        maxId: true,
        createdAt: true,
        orgMemberships: {
          select: {
            organizationId: true,
            role: true,
            organization: { select: { name: true, active: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const activeMemberships = user.orgMemberships.filter(
      (m) => m.organization.active,
    );

    const context: UserContext = {
      userId: user.id,
      isPlatformAdmin: user.isPlatformAdmin ?? false,
      orgMemberships: activeMemberships.map((m) => ({
        organizationId: m.organizationId,
        role: m.role,
      })),
    };

    // Список организаций пользователя для переключателя на фронте.
    const organizations = activeMemberships.map((m) => ({
      id: m.organizationId,
      name: m.organization.name,
      role: m.role,
    }));

    this.logger.log(`getMe userId=${userId}`);
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      lastName: user.lastName,
      avatarUrl: this.uploadService.toPublicUrl(user.avatarPath),
      phone: user.phone,
      vkId: user.vkId,
      telegramId: user.telegramId,
      maxId: user.maxId,
      createdAt: user.createdAt,
      capabilities: this.computeCapabilities(context),
      organizations,
    };
  }
}
