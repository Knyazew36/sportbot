import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { Prisma } from '@/generated/prisma/client';

import { AdminProgramTagGroupResponseDto } from './dto/admin-program-tag-group.response.dto';
import { CreateProgramTagGroupDto } from './dto/create-program-tag-group.dto';
import { ProgramTagGroupResponseDto } from './dto/program-tag-group.response.dto';
import { UpdateProgramTagGroupDto } from './dto/update-program-tag-group.dto';
import {
  ADMIN_TAG_SELECT,
  APPROVED_TAG,
  PROGRAM_TAG_SELECT,
  toAdminTag,
} from './program-tag.service';

const ADMIN_SELECT = {
  id: true,
  code: true,
  name: true,
  position: true,
  tags: {
    where: APPROVED_TAG,
    orderBy: { position: 'asc' },
    select: ADMIN_TAG_SELECT,
  },
} satisfies Prisma.ProgramTagGroupSelect;

type AdminRow = Prisma.ProgramTagGroupGetPayload<{
  select: typeof ADMIN_SELECT;
}>;

/** Тег с опубликованным шаблоном: тег без таких шаблонов дал бы пустую выдачу. */
const PUBLISHED_TEMPLATE = {
  programs: { some: { isTemplate: true, isPublished: true } },
} satisfies Prisma.ProgramTagWhereInput;

/** Группы тегов шаблонов — оси подбора программы: каждая группа — свой ряд чипов. */
@Injectable()
export class ProgramTagGroupService {
  private readonly logger = new Logger(`🏷️ ${ProgramTagGroupService.name}`);

  constructor(private readonly prisma: PrismaService) {}

  // ── Каталог ─────────────────────────────────────────────────────────────

  /** Ряды чипов каталога: теги с опубликованными шаблонами, пустые группы не показываем. */
  public async catalog(): Promise<ProgramTagGroupResponseDto[]> {
    const groups = await this.prisma.programTagGroup.findMany({
      where: { tags: { some: PUBLISHED_TEMPLATE } },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        position: true,
        tags: {
          where: PUBLISHED_TEMPLATE,
          orderBy: { position: 'asc' },
          select: PROGRAM_TAG_SELECT,
        },
      },
    });
    this.logger.debug(`Группы каталога: всего=${groups.length}`);
    return groups;
  }

  /** Все теги справочника по группам: форма публикации программы, где нужен тег из каждой группы. */
  public async all(): Promise<ProgramTagGroupResponseDto[]> {
    const groups = await this.prisma.programTagGroup.findMany({
      orderBy: { position: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        position: true,
        tags: {
          where: APPROVED_TAG,
          orderBy: { position: 'asc' },
          select: PROGRAM_TAG_SELECT,
        },
      },
    });
    this.logger.debug(`Все группы тегов: всего=${groups.length}`);
    return groups;
  }

  // ── Чтение ──────────────────────────────────────────────────────────────

  public async list(): Promise<AdminProgramTagGroupResponseDto[]> {
    const rows = await this.prisma.programTagGroup.findMany({
      orderBy: { position: 'asc' },
      select: ADMIN_SELECT,
    });
    this.logger.debug(`Группы тегов: всего=${rows.length}`);
    return rows.map((row) => this.toDto(row));
  }

  public async one(id: number): Promise<AdminProgramTagGroupResponseDto> {
    const row = await this.guard(() =>
      this.prisma.programTagGroup.findUniqueOrThrow({
        where: { id },
        select: ADMIN_SELECT,
      }),
    );
    return this.toDto(row);
  }

  // ── Изменение ───────────────────────────────────────────────────────────

  /** Новая группа встаёт последним рядом. */
  public async create(
    dto: CreateProgramTagGroupDto,
  ): Promise<AdminProgramTagGroupResponseDto> {
    const last = await this.prisma.programTagGroup.aggregate({
      _max: { position: true },
    });
    const row = await this.guard(() =>
      this.prisma.programTagGroup.create({
        data: {
          code: dto.code,
          name: dto.name,
          position: (last._max.position ?? 0) + 1,
        },
        select: ADMIN_SELECT,
      }),
    );
    this.logger.log(
      `Группа тегов создана: groupId=${row.id}, code=${row.code}`,
    );
    return this.toDto(row);
  }

  public async update(
    id: number,
    dto: UpdateProgramTagGroupDto,
  ): Promise<AdminProgramTagGroupResponseDto> {
    const row = await this.guard(() =>
      this.prisma.programTagGroup.update({
        where: { id },
        data: { code: dto.code, name: dto.name },
        select: ADMIN_SELECT,
      }),
    );
    this.logger.log(`Группа тегов изменена: groupId=${id}, code=${row.code}`);
    return this.toDto(row);
  }

  /** Группа с тегами не удаляется (Restrict): теги сначала переносят или удаляют. */
  public async remove(id: number): Promise<void> {
    await this.guard(() =>
      this.prisma.programTagGroup.delete({ where: { id } }),
    );
    this.logger.log(`Группа тегов удалена: groupId=${id}`);
  }

  /** ids — все группы в новом порядке. */
  public async reorder(
    ids: number[],
  ): Promise<AdminProgramTagGroupResponseDto[]> {
    const existing = await this.prisma.programTagGroup.findMany({
      select: { id: true },
    });
    const known = new Set(existing.map((g) => g.id));
    if (
      ids.length !== known.size ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !known.has(id))
    ) {
      this.logger.warn(
        `Порядок групп не совпал со списком: [${ids.join(',')}]`,
      );
      throw new BadRequestException(
        'Список групп устарел — обнови экран и попробуй ещё раз.',
      );
    }
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.programTagGroup.update({
          where: { id },
          data: { position: index + 1 },
        }),
      ),
    );
    this.logger.log(`Порядок групп тегов: [${ids.join(',')}]`);
    return this.list();
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private toDto(row: AdminRow): AdminProgramTagGroupResponseDto {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      position: row.position,
      tags: row.tags.map(toAdminTag),
    };
  }

  private async guard<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025')
          throw new NotFoundException('Группа тегов не найдена.');
        if (error.code === 'P2002')
          throw new ConflictException('Группа с таким кодом уже есть.');
        if (error.code === 'P2003') {
          this.logger.warn(`Удаление группы с тегами: ${error.message}`);
          throw new ConflictException(
            'В группе есть теги — перенеси их в другую группу или удали.',
          );
        }
      }
      throw error;
    }
  }
}
