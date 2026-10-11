import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ROLE_RANK } from '@/common/guards/org-access';
import { paginatePrisma } from '@/common/prisma/prisma-paginate';
import { PaginationQueryDto } from '@/common/type';
import { ENTITY_EMOJI } from '@/common/utils';
import { Prisma, User } from '@/generated/prisma/client';
import { PrismaService } from 'prisma/prisma.service';

import { UploadService } from '../upload/upload.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// passwordHash и сырые профили мессенджеров наружу не отдаём
const PUBLIC_USER_OMIT = {
  passwordHash: true,
  telegramData: true,
  maxData: true,
  vkData: true,
  data: true,
} satisfies Prisma.UserOmit;

type RawPublicUser = Prisma.UserGetPayload<{
  omit: typeof PUBLIC_USER_OMIT;
}>;
export type PublicUser = Omit<RawPublicUser, 'avatarPath'> & {
  avatarUrl: string | null;
};

@Injectable()
export class UserService {
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.user} ${UserService.name}`,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  // ── CRUD (платформенный админ) ──────────────────────────────────────────

  /** Список пользователей с пагинацией. `search` — по email / имени / фамилии. */
  public async list(query: PaginationQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const { items, meta } = await paginatePrisma(this.prisma.user, {
      ...query,
      where,
      omit: PUBLIC_USER_OMIT,
      sortable: ['id', 'createdAt', 'email', 'name', 'lastName'],
    });
    this.logger.log(`list: найдено ${meta.total}`);
    return {
      items: (items as RawPublicUser[]).map((u) => this.toPublicUser(u)),
      meta,
    };
  }

  /** Пользователь по id. Бросает 404, если нет. */
  public async findById(id: number): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: PUBLIC_USER_OMIT,
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    this.logger.log(`findById id=${id}`);
    return this.toPublicUser(user);
  }

  /**
   * Создаёт пользователя без пароля: пароль он задаёт сам через forgot-password → reset-password
   * (заодно подтверждает почту) либо входит через мессенджер.
   */
  public async create(dto: CreateUserDto): Promise<PublicUser> {
    const email = dto.email?.trim().toLowerCase() || null;

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          name: dto.name?.trim() || null,
          lastName: dto.lastName?.trim() || null,
          phone: dto.phone?.trim() || null,
          isPlatformAdmin: dto.isPlatformAdmin ?? false,
        },
        omit: PUBLIC_USER_OMIT,
      });
      this.logger.log(`Создан пользователь id=${user.id}`);
      return this.toPublicUser(user);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }
      throw e;
    }
  }

  /** Административное обновление: профиль + isPlatformAdmin. */
  public async update(id: number, dto: UpdateUserDto): Promise<PublicUser> {
    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim() || null;
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim() || null;
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;
    if (dto.isPlatformAdmin !== undefined)
      data.isPlatformAdmin = dto.isPlatformAdmin;

    const user = await this.updateOrNotFound(
      () =>
        this.prisma.user.update({
          where: { id },
          data,
          omit: PUBLIC_USER_OMIT,
        }),
      'Пользователь не найден',
    );
    this.logger.log(`Обновлён пользователь id=${id}`);
    return this.toPublicUser(user);
  }

  /**
   * Жёсткое удаление с каскадом. Прямые FK без onDelete (владелец, членства) сносим явно
   * в одной транзакции, иначе удаление упрётся в ограничения БД.
   */
  public async delete(id: number): Promise<PublicUser> {
    const removed = await this.prisma.$transaction(async (tx) => {
      const ownedOrgs = await tx.organization.deleteMany({
        where: { ownerUserId: id },
      });
      if (ownedOrgs.count > 0) {
        this.logger.warn(
          `Каскадно удалены организации владельца userId=${id}: ${ownedOrgs.count}`,
        );
      }
      await tx.organizationMembership.deleteMany({ where: { userId: id } });

      return this.updateOrNotFound(
        () => tx.user.delete({ where: { id }, omit: PUBLIC_USER_OMIT }),
        'Пользователь не найден',
      );
    });

    this.uploadService.deleteByRelativePath(removed.avatarPath);
    this.logger.log(`Удалён пользователь id=${id}`);
    return this.toPublicUser(removed);
  }

  // ── Свой профиль ────────────────────────────────────────────────────────

  /** Частичное обновление своего профиля. Пустая строка — «очистить поле». */
  public async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<void> {
    const data: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name.trim() || null;
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim() || null;
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;

    if (Object.keys(data).length === 0) return;

    await this.prisma.user.update({ where: { id: userId }, data });
    this.logger.log(`Обновлён профиль userId=${userId}`);
  }

  /**
   * Загружает/меняет свой аватар. Файл уже провалидирован (сигнатура) и лежит в стейджинге —
   * переносим в раздаваемую категорию, сохраняем путь в БД и только затем удаляем старый файл
   * (порядок важен: если update упадёт, новый файл остаётся сиротой, а не теряется старый).
   */
  public async setAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPath: true },
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const relativePath = this.uploadService.commitToCategory(
      file.path,
      'avatars',
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarPath: relativePath },
    });
    if (user.avatarPath) {
      this.uploadService.deleteByRelativePath(user.avatarPath);
    }
    this.logger.log(`Обновлён аватар userId=${userId}`);
  }

  // ── Слияние аккаунтов ───────────────────────────────────────────────────

  /**
   * Слияние аккаунта мессенджера (current) в веб-аккаунт (target) при привязке через бота:
   * у этого telegramId/maxId/vkId уже есть своя строка User (заходил в мини-приложение или
   * писал боту). Владение обоими аккаунтами подтверждено до вызова: одноразовый токен
   * веб-сессии плюс явное «Привязать» в чате (см. messengers/*/ deeplink; /*-link.service.ts).
   */
  public async mergeMessengerAccountInto(
    currentUserId: number,
    targetUserId: number,
  ): Promise<User> {
    const current = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!current) {
      throw new NotFoundException('Пользователь не найден');
    }
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) {
      throw new NotFoundException('Веб-аккаунт не найден');
    }
    if (target.id === current.id) return target;

    // current при слиянии удаляется. Если это полноценный веб-аккаунт (есть email), а не строка,
    // заведённая ботом, — пользователь потерял бы вход по почте, поэтому не сливаем
    if (current.email) {
      throw new ConflictException(
        'Этот аккаунт мессенджера уже привязан к другому веб-аккаунту с почтой — объединить их нельзя',
      );
    }

    if (target.maxId && current.maxId && target.maxId !== current.maxId) {
      throw new ConflictException(
        'К этому веб-аккаунту уже привязан другой MAX-аккаунт',
      );
    }
    if (
      target.telegramId &&
      current.telegramId &&
      target.telegramId !== current.telegramId
    ) {
      throw new ConflictException(
        'К этому веб-аккаунту уже привязан другой Telegram-аккаунт',
      );
    }
    if (target.vkId && current.vkId && target.vkId !== current.vkId) {
      throw new ConflictException(
        'К этому веб-аккаунту уже привязан другой VK-аккаунт',
      );
    }

    return this.mergeUsers(current, target);
  }

  // ── Вспомогательное ─────────────────────────────────────────────────────

  /**
   * Транзакция слияния: target выживает, в него переезжают данные current, current удаляется.
   * Проект дописывает сюда перенос своих сущностей, ссылающихся на User.
   */
  private async mergeUsers(current: User, target: User): Promise<User> {
    const merged = await this.prisma.$transaction(async (tx) => {
      // 1. Членства: перенести, при конфликте остаётся старшая роль
      const memberships = await tx.organizationMembership.findMany({
        where: { userId: current.id },
      });
      for (const membership of memberships) {
        const existing = await tx.organizationMembership.findUnique({
          where: {
            organizationId_userId: {
              organizationId: membership.organizationId,
              userId: target.id,
            },
          },
        });
        if (!existing) {
          await tx.organizationMembership.update({
            where: { id: membership.id },
            data: { userId: target.id },
          });
          continue;
        }
        if (ROLE_RANK[membership.role] > ROLE_RANK[existing.role]) {
          await tx.organizationMembership.update({
            where: { id: existing.id },
            data: { role: membership.role },
          });
        }
        await tx.organizationMembership.delete({
          where: { id: membership.id },
        });
        this.logger.log(
          `mergeUsers: organizationId=${membership.organizationId} — членство уже было, оставлена старшая роль`,
        );
      }

      // 2. Владение организациями и история — переставляем на target
      await tx.organization.updateMany({
        where: { ownerUserId: current.id },
        data: { ownerUserId: target.id },
      });
      await tx.notification.updateMany({
        where: { userId: current.id },
        data: { userId: target.id },
      });
      await tx.joinRequest.updateMany({
        where: { userId: current.id },
        data: { userId: target.id },
      });
      await tx.auditLog.updateMany({
        where: { userId: current.id },
        data: { userId: target.id },
      });

      // 3. Идентификаторы мессенджеров: сперва снять с current (уникальность), потом поставить на target
      const identity: Prisma.UserUncheckedUpdateInput = {};
      if (current.maxId) {
        identity.maxId = current.maxId;
        identity.maxData = current.maxData ?? Prisma.JsonNull;
      }
      if (current.telegramId) {
        identity.telegramId = current.telegramId;
        identity.telegramData = current.telegramData ?? Prisma.JsonNull;
      }
      if (current.vkId) {
        identity.vkId = current.vkId;
        identity.vkData = current.vkData ?? Prisma.JsonNull;
      }
      // Служебные маркеры диалогов с ботами (User.data) переезжают вместе с идентификаторами
      identity.data = {
        ...((current.data as Record<string, unknown> | null) ?? {}),
        ...((target.data as Record<string, unknown> | null) ?? {}),
      } as Prisma.InputJsonValue;

      // Персональные настройки уведомлений current уходят каскадом вместе с ним
      await tx.user.delete({ where: { id: current.id } });
      return tx.user.update({ where: { id: target.id }, data: identity });
    });

    this.uploadService.deleteByRelativePath(current.avatarPath);
    this.logger.log(
      `Аккаунты объединены: userId=${current.id} → userId=${target.id}`,
    );
    return merged;
  }

  private toPublicUser(user: RawPublicUser): PublicUser {
    const { avatarPath, ...rest } = user;
    return {
      ...rest,
      avatarUrl: this.uploadService.toPublicUrl(avatarPath),
    };
  }

  /** Оборачивает мутацию: Prisma P2025 (запись не найдена) → понятный 404. */
  private async updateOrNotFound<T>(
    op: () => Promise<T>,
    message: string,
  ): Promise<T> {
    try {
      return await op();
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(message);
      }
      throw e;
    }
  }
}
