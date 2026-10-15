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
} satisfies Prisma.ProgramTagSelect;

const ADMIN_SELECT = {
  ...PROGRAM_TAG_SELECT,
  _count: { select: { programs: true } },
} satisfies Prisma.ProgramTagSelect;

type AdminRow = Prisma.ProgramTagGetPayload<{ select: typeof ADMIN_SELECT }>;

/** Теги шаблонов программ: справочник администратора для чипов-фильтров. */
@Injectable()
export class ProgramTagService {
  private readonly logger = new Logger(`🏷️ ${ProgramTagService.name}`);

  constructor(private readonly prisma: PrismaService) {}

  // ── Чтение ──────────────────────────────────────────────────────────────

  public async list(): Promise<AdminProgramTagResponseDto[]> {
    const rows = await this.prisma.programTag.findMany({
      orderBy: { position: 'asc' },
      select: ADMIN_SELECT,
    });
    this.logger.debug(`Теги: всего=${rows.length}`);
    return rows.map((row) => this.toDto(row));
  }

  public async one(id: number): Promise<AdminProgramTagResponseDto> {
    const row = await this.guard(() =>
      this.prisma.programTag.findUniqueOrThrow({
        where: { id },
        select: ADMIN_SELECT,
      }),
    );
    return this.toDto(row);
  }

  // ── Изменение ───────────────────────────────────────────────────────────

  /** Новый тег встаёт последним чипом. */
  public async create(
    dto: CreateProgramTagDto,
  ): Promise<AdminProgramTagResponseDto> {
    const last = await this.prisma.programTag.aggregate({
      _max: { position: true },
    });
    const row = await this.guard(() =>
      this.prisma.programTag.create({
        data: {
          code: dto.code,
          name: dto.name,
          position: (last._max.position ?? 0) + 1,
        },
        select: ADMIN_SELECT,
      }),
    );
    this.logger.log(`Тег создан: tagId=${row.id}, code=${row.code}`);
    return this.toDto(row);
  }

  public async update(
    id: number,
    dto: UpdateProgramTagDto,
  ): Promise<AdminProgramTagResponseDto> {
    const row = await this.guard(() =>
      this.prisma.programTag.update({
        where: { id },
        data: { code: dto.code, name: dto.name },
        select: ADMIN_SELECT,
      }),
    );
    this.logger.log(`Тег изменён: tagId=${id}, code=${row.code}`);
    return this.toDto(row);
  }

  /** Связи с шаблонами удаляются каскадом: шаблоны остаются, тег просто пропадает с них. */
  public async remove(id: number): Promise<void> {
    await this.guard(() => this.prisma.programTag.delete({ where: { id } }));
    this.logger.log(`Тег удалён: tagId=${id}`);
  }

  /** ids — все теги в новом порядке. */
  public async reorder(ids: number[]): Promise<AdminProgramTagResponseDto[]> {
    const existing = await this.prisma.programTag.findMany({
      select: { id: true },
    });
    const known = new Set(existing.map((t) => t.id));
    if (
      ids.length !== known.size ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !known.has(id))
    ) {
      this.logger.warn(
        `Порядок тегов не совпал со списком: [${ids.join(',')}]`,
      );
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

  private toDto(row: AdminRow): AdminProgramTagResponseDto {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      position: row.position,
      templateCount: row._count.programs,
    };
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
      }
      throw error;
    }
  }
}
