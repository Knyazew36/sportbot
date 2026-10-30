import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { STRETCH_INCLUDE } from '@/catalog/catalog.service';
import { Prisma } from '@/generated/prisma/client';
import { UploadService } from '@/upload/upload.service';
import { cooldownStretchView } from '@/workout/cooldown-stretch-view';

import { CreateStretchRoutineDto } from './dto/create-stretch-routine.dto';
import { StretchRoutineResponseDto } from './dto/stretch-routine.response.dto';
import { UpdateStretchRoutineDto } from './dto/update-stretch-routine.dto';

const ROUTINE_INCLUDE = {
  items: {
    orderBy: { position: 'asc' },
    include: { stretch: { include: STRETCH_INCLUDE } },
  },
} satisfies Prisma.StretchRoutineInclude;

type RoutineFull = Prisma.StretchRoutineGetPayload<{
  include: typeof ROUTINE_INCLUDE;
}>;

const ROUTINE_ORDER = [
  { position: 'asc' },
  { id: 'asc' },
] satisfies Prisma.StretchRoutineOrderByWithRelationInput[];

/** Готовые комплексы растяжек: читают все, правит админ. */
@Injectable()
export class StretchRoutineService {
  private readonly logger = new Logger(`🧘 ${StretchRoutineService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadService,
  ) {}

  // ── Чтение ──────────────────────────────────────────────────────────────

  public async list(
    onlyPublished: boolean,
  ): Promise<StretchRoutineResponseDto[]> {
    const items = await this.prisma.stretchRoutine.findMany({
      where: onlyPublished ? { published: true } : {},
      orderBy: ROUTINE_ORDER,
      include: ROUTINE_INCLUDE,
    });
    this.logger.debug(
      `Список комплексов: всего=${items.length}, только опубликованные=${onlyPublished}`,
    );
    return items.map((item) => this.view(item));
  }

  public async find(
    id: number,
    onlyPublished: boolean,
  ): Promise<StretchRoutineResponseDto> {
    const item = await this.prisma.stretchRoutine.findFirst({
      where: { id, ...(onlyPublished ? { published: true } : {}) },
      include: ROUTINE_INCLUDE,
    });
    if (!item) throw new NotFoundException('Комплекс не найден.');
    return this.view(item);
  }

  // ── Запись ──────────────────────────────────────────────────────────────

  public async create(
    dto: CreateStretchRoutineDto,
  ): Promise<StretchRoutineResponseDto> {
    try {
      const item = await this.prisma.stretchRoutine.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() ?? '',
          published: dto.published ?? true,
          position: dto.position ?? 0,
          items: { create: this.itemsData(dto.stretchIds) },
        },
        include: ROUTINE_INCLUDE,
      });
      this.logger.log(
        `Комплекс создан: id=${item.id}, растяжек=${dto.stretchIds.length}`,
      );
      return this.view(item);
    } catch (error) {
      throw this.known(error);
    }
  }

  public async update(
    id: number,
    dto: UpdateStretchRoutineDto,
  ): Promise<StretchRoutineResponseDto> {
    try {
      const item = await this.prisma.stretchRoutine.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.description !== undefined && {
            description: dto.description.trim(),
          }),
          ...(dto.published !== undefined && { published: dto.published }),
          ...(dto.position !== undefined && { position: dto.position }),
          // Состав заменяется целиком: порядок задан списком
          ...(dto.stretchIds && {
            items: {
              deleteMany: {},
              create: this.itemsData(dto.stretchIds),
            },
          }),
        },
        include: ROUTINE_INCLUDE,
      });
      this.logger.log(`Комплекс изменён: id=${id}`);
      return this.view(item);
    } catch (error) {
      throw this.known(error);
    }
  }

  public async remove(id: number): Promise<void> {
    try {
      await this.prisma.stretchRoutine.delete({ where: { id } });
    } catch (error) {
      throw this.known(error);
    }
    this.logger.log(`Комплекс удалён: id=${id}`);
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private itemsData(stretchIds: number[]) {
    return stretchIds.map((stretchId, index) => ({
      stretchId,
      position: index + 1,
    }));
  }

  private view(item: RoutineFull): StretchRoutineResponseDto {
    const stretches = item.items.map((i) => i.stretch);
    const seconds = stretches.reduce(
      (sum, s) => sum + s.holdSeconds * (s.perSide ? 2 : 1),
      0,
    );
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      published: item.published,
      minutes: Math.ceil(seconds / 60),
      stretches: stretches.map((s) =>
        cooldownStretchView(s, (path) => this.uploads.toPublicUrl(path)),
      ),
    };
  }

  private known(error: unknown): unknown {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return error;
    if (error.code === 'P2025')
      return new NotFoundException('Комплекс не найден.');
    if (error.code === 'P2002')
      return new ConflictException('Такой комплекс уже есть.');
    // Нарушенная связь на записи состава — такой растяжки нет
    if (error.code === 'P2003')
      return new BadRequestException('Растяжка из состава не найдена.');
    this.logger.error(`Сбой записи комплекса: ${error.code}`, error.stack);
    return error;
  }
}
