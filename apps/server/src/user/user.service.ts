import {
  ConflictException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { paginatePrisma } from '@/common/prisma/prisma-paginate';
import { PaginationQueryDto } from '@/common/type';
import { ENTITY_EMOJI } from '@/common/utils';
import { resolveAvatarUrl, resolveVkName } from '@/common/vk/resolve-vk-profile';
import { Prisma, User } from '@/generated/prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { generateInviteToken } from '../invite/model/invite-code.util';

import { VkService } from '../vk/vk.service';
import { UploadService } from '../upload/upload.service';

import { CreateChildDto } from './dto/create-child.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserInclude } from '@/generated/prisma/models';

/** Срок жизни ссылки на ребёнка (второй родитель). */
const CHILD_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// passwordHash / vkUserId никогда не отдаём наружу; vkData тоже не отдаём — но выбираем
// его на уровне Prisma (см. toPublicUser), чтобы вычислить фолбэк-аватар/имя для
// VK-only пользователей без своих name/lastName/avatarPath (см. resolveVkProfile)
const PUBLIC_USER_OMIT = {
  passwordHash: true,
  vkUserId: true,
} satisfies Prisma.UserOmit;

type RawPublicUser = Prisma.UserGetPayload<{
  omit: typeof PUBLIC_USER_OMIT;
}>;
export type PublicUser = Omit<RawPublicUser, 'avatarPath' | 'vkData'> & {
  avatarUrl: string | null;
};

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly vkService: VkService,
  ) {}

  private toPublicUser(user: RawPublicUser): PublicUser {
    const { avatarPath, vkData, name, lastName, ...rest } = user;
    return {
      ...rest,
      ...resolveVkName(name, lastName, vkData),
      avatarUrl: resolveAvatarUrl(avatarPath, vkData, this.uploadService),
    };
  }

  // ---------- CRUD ----------

  /** Список пользователей с пагинацией. `search` — по email / имени / фамилии. */
  public async list(query: PaginationQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { displayName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const { items, meta } = await paginatePrisma(this.prisma.user, {
      ...query,
      where,
      omit: PUBLIC_USER_OMIT,
      include: {
        parents: { orderBy: { id: 'asc' }, omit: PUBLIC_USER_OMIT },
      },
    });
    this.logger.log(`${ENTITY_EMOJI.user} list: найдено ${meta.total}`);
    return {
      items: items.map((u) => {
        const { parents, ...rest } = u as unknown as RawPublicUser & { parents: RawPublicUser[] };
        return {
          ...this.toPublicUser(rest),
          parents: parents?.map((p) => this.toPublicUser(p)),
        };
      }),
      meta,
    };
  }

  /**
   * Пользователь по id. Бросает 404, если нет.
   * options.addChildren — приложить список детей одним запросом (пример паттерна add_*).
   */
  public async findById(
    id: number,
    options?: { addChildren?: boolean },
  ): Promise<PublicUser & { children?: PublicUser[] }> {
    const userInclude: UserInclude = {
      ...(options?.addChildren && {
        children: {
          orderBy: { createdAt: 'asc' },
          omit: PUBLIC_USER_OMIT,
        },
      }),
    };

    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: PUBLIC_USER_OMIT,
      include: userInclude,
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    const { children, ...rest } = user;

    this.logger.log(`${ENTITY_EMOJI.user} findById id=${id}`);
    return {
      ...this.toPublicUser(rest),
      children: children?.map((c) => this.toPublicUser(c)),
    };
  }

  /**
   * Полная карточка пользователя для платформенной админки — без PUBLIC_USER_OMIT
   * (включая vkUserId/vkData), скрыт только passwordHash. vkUserId переводим в string:
   * BigInt не сериализуется в JSON напрямую.
   */
  public async findByIdAdmin(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { passwordHash: true },
      include: {
        children: { orderBy: { createdAt: 'asc' }, omit: PUBLIC_USER_OMIT },
        parents: { orderBy: { id: 'asc' }, omit: PUBLIC_USER_OMIT },
      },
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    const { children, parents, avatarPath, vkUserId, ...rest } = user;

    this.logger.log(`${ENTITY_EMOJI.user} findByIdAdmin id=${id}`);
    return {
      ...rest,
      avatarUrl: this.uploadService.toPublicUrl(avatarPath),
      vkUserId: vkUserId != null ? vkUserId.toString() : null,
      children: children?.map((c) => this.toPublicUser(c)),
      parents: parents?.map((p) => this.toPublicUser(p)),
    };
  }

  /** Внутренний поиск по email (с passwordHash) — для auth-флоу. Без нормализации. */
  public findRawByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Создаёт пользователя без пароля (пароль пользователь задаёт сам через reset-password,
   * либо входит через VK). Педагог — обычный пользователь, отдельной сущности нет.
   */
  public async create(dto: CreateUserDto): Promise<PublicUser> {
    const email = dto.email?.trim().toLowerCase() || null;

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          name: dto.name?.trim() || null,
          lastName: dto.lastName?.trim() || null,
          displayName: dto.displayName?.trim() || null,
          phone: dto.phone?.trim() || null,
          isPlatformAdmin: dto.isPlatformAdmin ?? false,
        },
        omit: PUBLIC_USER_OMIT,
      });
      this.logger.log(`${ENTITY_EMOJI.user} Создан пользователь id=${user.id}`);
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

  /** Полное административное обновление: профиль + active + isPlatformAdmin. */
  public async update(id: number, dto: UpdateUserDto): Promise<PublicUser> {
    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim() || null;
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim() || null;
    if (dto.displayName !== undefined)
      data.displayName = dto.displayName.trim() || null;
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;
    if (dto.active !== undefined) data.active = dto.active;
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
    this.logger.log(`${ENTITY_EMOJI.user} Обновлён пользователь id=${id}`);
    return this.toPublicUser(user);
  }

  /**
   * Жёсткое удаление с каскадом. Прямые FK без onDelete (владелец, членства, посещения,
   * уведомления) сносим явно в одной транзакции, иначе удаление упрётся в ограничения БД.
   * Дети (User.children) остаются: это самостоятельные пользователи, связь снимается сама.
   */
  public async delete(id: number): Promise<PublicUser> {
    const removed = await this.prisma.$transaction(async (tx) => {
      const ownedOrgs = await tx.organization.deleteMany({ where: { ownerUserId: id } });
      if (ownedOrgs.count > 0) {
        this.logger.warn(
          `${ENTITY_EMOJI.user} Каскадно удалены кружки владельца userId=${id}: ${ownedOrgs.count}`,
        );
      }
      await tx.lessonNotification.deleteMany({
        where: { OR: [{ participantUserId: id }, { recipientUserId: id }] },
      });
      await tx.lessonAttendance.deleteMany({ where: { userId: id } });
      await tx.groupMembership.deleteMany({ where: { userId: id } });
      await tx.organizationMembership.deleteMany({ where: { userId: id } });

      return this.updateOrNotFound(
        () => tx.user.delete({ where: { id }, omit: PUBLIC_USER_OMIT }),
        'Пользователь не найден',
      );
    });

    this.uploadService.deleteByRelativePath(removed.avatarPath);
    this.logger.log(`${ENTITY_EMOJI.user} Удалён пользователь id=${id}`);
    return this.toPublicUser(removed);
  }

  /** Восстановление после мягкого удаления. */
  public async restore(id: number): Promise<PublicUser> {
    const user = await this.updateOrNotFound(
      () =>
        this.prisma.user.update({
          where: { id },
          data: { active: true },
          omit: PUBLIC_USER_OMIT,
        }),
      'Пользователь не найден',
    );
    this.logger.log(`${ENTITY_EMOJI.user} Восстановлен пользователь id=${id}`);
    return this.toPublicUser(user);
  }

  // ---------- VK ----------

  /** Тестовая отправка сообщения от единого сообщества платформы — для проверки VK-интеграции. */
  public async sendVkMessage(
    userId: number,
    text: string,
  ): Promise<{ vkMessageId: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { vkUserId: true },
    });
    if (!user?.vkUserId) {
      throw new NotFoundException('У пользователя нет привязанного VK-аккаунта');
    }
    this.logger.log(`${ENTITY_EMOJI.user} Тестовое VK-сообщение userId=${userId}`);
    return this.vkService.sendMessage(user.vkUserId, text);
  }

  /**
   * Пользователи с привязанным VK-аккаунтом (для админ-раздела рассылки) — отдельный
   * запрос, а не `list`/`PUBLIC_USER_OMIT`: тот контракт намеренно никогда не отдаёт
   * даже факт наличия vkUserId, здесь — осознанное исключение только для админки.
   */
  public async listVkContacts(query: PaginationQueryDto) {
    const { items, meta } = await paginatePrisma(this.prisma.user, {
      ...query,
      where: { vkUserId: { not: null } },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        avatarPath: true,
        vkMessagesAllowed: true,
        createdAt: true,
      },
    });

    this.logger.log(`${ENTITY_EMOJI.user} listVkContacts: найдено ${meta.total}`);
    return {
      items: items.map(({ avatarPath, ...rest }) => ({
        ...rest,
        avatarUrl: this.uploadService.toPublicUrl(avatarPath),
      })),
      meta,
    };
  }

  // ---------- self-service ----------

  /** Частичное обновление своего профиля. Пустая строка — «очистить поле». */
  public async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<void> {
    const data: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name.trim() || null;
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim() || null;
    if (dto.displayName !== undefined)
      data.displayName = dto.displayName.trim() || null;
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;

    if (Object.keys(data).length === 0) return;

    await this.prisma.user.update({ where: { id: userId }, data });
    this.logger.log(`${ENTITY_EMOJI.user} Обновлён профиль userId=${userId}`);
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

    await this.replaceAvatar(userId, user.avatarPath, file);
    this.logger.log(`${ENTITY_EMOJI.user} Обновлён аватар userId=${userId}`);
  }

  /** Аватар ребёнка. Принадлежность родителю проверяется тем же запросом, что читает старый путь. */
  public async setChildAvatar(
    parentUserId: number,
    childId: number,
    file: Express.Multer.File,
  ): Promise<PublicUser> {
    const child = await this.prisma.user.findFirst({
      where: { id: childId, parents: { some: { id: parentUserId } } },
      select: { avatarPath: true },
    });
    if (!child) {
      this.uploadService.discardTmpFile(file.path);
      throw new NotFoundException('Ребёнок не найден');
    }

    await this.replaceAvatar(childId, child.avatarPath, file);
    const updated = await this.prisma.user.findUniqueOrThrow({
      where: { id: childId },
      omit: PUBLIC_USER_OMIT,
    });
    this.logger.log(
      `${ENTITY_EMOJI.user} Обновлён аватар ребёнка id=${childId} parent=${parentUserId}`,
    );
    return this.toPublicUser(updated);
  }

  // ---------- дети (родитель↔ребёнок) ----------

  /** Дети текущего пользователя. */
  public async listChildren(parentUserId: number): Promise<PublicUser[]> {
    const children = await this.prisma.user.findMany({
      where: { parents: { some: { id: parentUserId } } },
      orderBy: { createdAt: 'asc' },
      omit: PUBLIC_USER_OMIT,
    });
    this.logger.log(
      `${ENTITY_EMOJI.user} listChildren parent=${parentUserId}: ${children.length}`,
    );
    return children.map((c) => this.toPublicUser(c));
  }

  /** Создаёт ребёнка (обычный User без email/vkUserId) и сразу привязывает к родителю. */
  public async createChild(
    parentUserId: number,
    dto: CreateChildDto,
  ): Promise<PublicUser> {
    const child = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        lastName: dto.lastName?.trim() || null,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        parents: { connect: { id: parentUserId } },
      },
      omit: PUBLIC_USER_OMIT,
    });
    this.logger.log(
      `${ENTITY_EMOJI.user} Создан ребёнок id=${child.id} parent=${parentUserId}`,
    );
    return this.toPublicUser(child);
  }

  /** Частичное обновление своего ребёнка. */
  public async updateChild(
    parentUserId: number,
    childId: number,
    dto: UpdateChildDto,
  ): Promise<PublicUser> {
    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim() || null;
    if (dto.birthDate !== undefined)
      data.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;

    const child = await this.updateOrNotFound(
      () =>
        this.prisma.user.update({
          // id + фильтр по родителю в одном where — Prisma сам вернёт P2025,
          // если ребёнок не найден или принадлежит другому родителю
          where: { id: childId, parents: { some: { id: parentUserId } } },
          data,
          omit: PUBLIC_USER_OMIT,
        }),
      'Ребёнок не найден',
    );
    this.logger.log(
      `${ENTITY_EMOJI.user} Обновлён ребёнок id=${childId} parent=${parentUserId}`,
    );
    return this.toPublicUser(child);
  }

  /**
   * Отвязывает ребёнка от родителя (не удаляет User — у ребёнка может быть
   * второй родитель или уже есть история занятий).
   */
  public async removeChild(
    parentUserId: number,
    childId: number,
  ): Promise<void> {
    await this.updateOrNotFound(
      () =>
        this.prisma.user.update({
          where: { id: childId, parents: { some: { id: parentUserId } } },
          data: { parents: { disconnect: { id: parentUserId } } },
        }),
      'Ребёнок не найден',
    );
    this.logger.log(
      `${ENTITY_EMOJI.user} Отвязан ребёнок id=${childId} parent=${parentUserId}`,
    );
  }

  // ── Связь с ребёнком по ссылке (второй родитель) ─────────────────────────────

  /**
   * Ссылка, которой родитель приглашает второго родителя к уже созданному ребёнку.
   * Одноразовая, живёт 7 дней. Дубль профиля ребёнка не создаётся.
   */
  public async createChildLink(
    parentUserId: number,
    childId: number,
  ): Promise<{ token: string; expiresAt: Date }> {
    const child = await this.prisma.user.findFirst({
      where: { id: childId, parents: { some: { id: parentUserId } } },
      select: { id: true },
    });
    if (!child) {
      throw new NotFoundException('Ребёнок не найден');
    }

    const expiresAt = new Date(Date.now() + CHILD_LINK_TTL_MS);
    const link = await this.prisma.childLinkInvite.create({
      data: {
        token: generateInviteToken(),
        childUserId: childId,
        createdByUserId: parentUserId,
        expiresAt,
      },
      select: { token: true, expiresAt: true },
    });
    this.logger.log(
      `${ENTITY_EMOJI.user} Создана ссылка на ребёнка childId=${childId} parent=${parentUserId}`,
    );
    return link;
  }

  /** Второй родитель принимает ссылку: ребёнок привязывается к нему, профиль не дублируется. */
  public async redeemChildLink(
    callerUserId: number,
    token: string,
  ): Promise<{ childUserId: number; name: string | null; lastName: string | null }> {
    const link = await this.prisma.childLinkInvite.findUnique({
      where: { token: token.trim() },
      select: { id: true, childUserId: true, expiresAt: true, usedAt: true },
    });
    if (!link) {
      throw new NotFoundException('Ссылка не найдена');
    }
    if (link.usedAt) {
      throw new ConflictException('Ссылка уже использована');
    }
    if (link.expiresAt.getTime() < Date.now()) {
      throw new GoneException('Срок ссылки истёк');
    }

    const child = await this.prisma.$transaction(async (tx) => {
      // Гард на повторное использование в самой записи: два параллельных клика не привяжут дважды.
      const claimed = await tx.childLinkInvite.updateMany({
        where: { id: link.id, usedAt: null },
        data: { usedAt: new Date(), usedByUserId: callerUserId },
      });
      if (claimed.count === 0) {
        throw new ConflictException('Ссылка уже использована');
      }
      return tx.user.update({
        where: { id: link.childUserId },
        data: { parents: { connect: { id: callerUserId } } },
        select: { id: true, name: true, lastName: true },
      });
    });

    this.logger.log(
      `${ENTITY_EMOJI.user} Ребёнок childId=${child.id} привязан к родителю userId=${callerUserId} по ссылке`,
    );
    return { childUserId: child.id, name: child.name, lastName: child.lastName };
  }

  // ---------- helpers ----------

  private async replaceAvatar(
    userId: number,
    oldPath: string | null,
    file: Express.Multer.File,
  ): Promise<void> {
    const relativePath = this.uploadService.commitToCategory(
      file.path,
      'avatars',
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarPath: relativePath },
    });

    if (oldPath) {
      this.uploadService.deleteByRelativePath(oldPath);
    }
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
