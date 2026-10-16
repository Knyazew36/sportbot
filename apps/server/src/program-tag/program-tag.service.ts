import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { Prisma } from '@/generated/prisma/client';

import { AdminProgramTagResponseDto } from './dto/admin-program-tag.response.dto';
import { CreateProgramTagDto } from './dto/create-program-tag.dto';
import { UpdateProgramTagDto } from './dto/update-program-tag.dto';

/** Поля тега, которые видят пользователи: чипы и бейджи шаблонов. */
export const PROGRAM_TAG_SELECT = {
  id: true,
  code: true,
  name: true,
  position: true,
  groupId: true,
  isApproved: true,
} satisfies Prisma.ProgramTagSelect;

/** Теги по порядку: сначала ряд группы, потом место чипа в ряду. */
export const PROGRAM_TAG_ORDER = [
  { group: { position: 'asc' } },
  { position: 'asc' },
] satisfies Prisma.ProgramTagOrderByWithRelationInput[];

/** Тег справочника; предложенные авторами до одобрения в справочник и порядок чипов не входят. */
export const APPROVED_TAG = {
  isApproved: true,
} satisfies Prisma.ProgramTagWhereInput;

export const ADMIN_TAG_SELECT = {
  ...PROGRAM_TAG_SELECT,
  _count: { select: { programs: true } },
} satisfies Prisma.ProgramTagSelect;

type AdminRow = Prisma.ProgramTagGetPayload<{
  select: typeof ADMIN_TAG_SELECT;
}>;

export const toAdminTag = (row: AdminRow): AdminProgramTagResponseDto => ({
  id: row.id,
  code: row.code,
  name: row.name,
  position: row.position,
  groupId: row.groupId,
  isApproved: row.isApproved,
  templateCount: row._count.programs,
});

/** Теги шаблонов программ: справочник администратора для чипов-фильтров каталога. */
@Injectable()
export class ProgramTagService {
  private readonly logger = new Logger(`🏷️ ${ProgramTagService.name}`);

  constructor(private readonly prisma: PrismaService) {}

  // ── Чтение ──────────────────────────────────────────────────────────────

  public async list(): Promise<AdminProgramTagResponseDto[]> {
    const rows = await this.prisma.programTag.findMany({
      where: APPROVED_TAG,
      orderBy: PROGRAM_TAG_ORDER,
      select: ADMIN_TAG_SELECT,
    });
    this.logger.debug(`Теги: всего=${rows.length}`);
    return rows.map(toAdminTag);
  }

  public async one(id: number): Promise<AdminProgramTagResponseDto> {
    const row = await this.guard(() =>
      this.prisma.programTag.findUniqueOrThrow({
        where: { id },
        select: ADMIN_TAG_SELECT,
      }),
    );
    return toAdminTag(row);
  }

  // ── Изменение ───────────────────────────────────────────────────────────

  /** Новый тег встаёт последним чипом своей группы. */
  public async create(
    dto: CreateProgramTagDto,
  ): Promise<AdminProgramTagResponseDto> {
    const position = await this.nextPosition(dto.groupId);
    const row = await this.guard(() =>
      this.prisma.programTag.create({
        data: {
          code: dto.code,
          name: dto.name,
          groupId: dto.groupId,
          position,
        },
        select: ADMIN_TAG_SELECT,
      }),
    );
    this.logger.log(
      `Тег создан: tagId=${row.id}, code=${row.code}, groupId=${row.groupId}`,
    );
    return toAdminTag(row);
  }

  public async update(
    id: number,
    dto: UpdateProgramTagDto,
  ): Promise<AdminProgramTagResponseDto> {
    // Перенос в другую группу: тег встаёт последним в ней; та же группа — место не меняется
    if (dto.groupId !== undefined) {
      const position = await this.nextPosition(dto.groupId);
      const { count } = await this.guard(() =>
        this.prisma.programTag.updateMany({
          where: { id, groupId: { not: dto.groupId } },
          data: { groupId: dto.groupId, position },
        }),
      );
      if (count)
        this.logger.log(`Тег перенесён: tagId=${id}, groupId=${dto.groupId}`);
    }
    const row = await this.guard(() =>
      this.prisma.programTag.update({
        where: { id },
        data: { code: dto.code, name: dto.name },
        select: ADMIN_TAG_SELECT,
      }),
    );
    this.logger.log(`Тег изменён: tagId=${id}, code=${row.code}`);
    return toAdminTag(row);
  }

  /** Связи с шаблонами удаляются каскадом: шаблоны остаются, тег просто пропадает с них. */
  public async remove(id: number): Promise<void> {
    await this.guard(() => this.prisma.programTag.delete({ where: { id } }));
    this.logger.log(`Тег удалён: tagId=${id}`);
  }

  /** ids — все теги одной группы в новом порядке. */
  public async reorder(ids: number[]): Promise<AdminProgramTagResponseDto[]> {
    // Соседи первого тега по группе — с ними и сверяем выборку
    const siblings = await this.prisma.programTag.findMany({
      where: { ...APPROVED_TAG, group: { tags: { some: { id: ids[0] } } } },
      select: { id: true },
    });
    const known = new Set(siblings.map((t) => t.id));
    if (
      ids.length !== known.size ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !known.has(id))
    ) {
      this.logger.warn(`Порядок тегов не совпал с группой: [${ids.join(',')}]`);
      throw new BadRequestException(
        'Список тегов устарел — обнови экран и попробуй ещё раз.',
      );
    }
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.programTag.update({
          where: { id },
          data: { position: index + 1 },
        }),
      ),
    );
    this.logger.log(`Порядок тегов: [${ids.join(',')}]`);
    return this.list();
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private async nextPosition(groupId: number): Promise<number> {
    const last = await this.prisma.programTag.aggregate({
      where: { groupId, ...APPROVED_TAG },
      _max: { position: true },
    });
    return (last._max.position ?? 0) + 1;
  }

  private async guard<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025')
          throw new NotFoundException('Тег не найден.');
        if (error.code === 'P2002')
          throw new ConflictException('Тег с таким кодом уже есть.');
        if (error.code === 'P2003')
          throw new BadRequestException('Группа не найдена — обнови экран.');
      }
      throw error;
    }
  }
}
