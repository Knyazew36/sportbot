import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { APP_SCREEN, appBtn, BotSender, msg } from '@/bot';
import { CatalogKind, normalizeName } from '@/catalog/catalog.service';
import { paginatePrisma } from '@/common/prisma';
import { Prisma } from '@/generated/prisma/client';
import { UploadService } from '@/upload/upload.service';

import { AdminCatalogItemResponseDto } from './dto/admin-catalog-item.response.dto';
import { AdminCatalogQueryDto } from './dto/admin-catalog-query.dto';
import { AdminExerciseResponseDto } from './dto/admin-exercise.response.dto';
import { AdminStretchResponseDto } from './dto/admin-stretch.response.dto';
import { CatalogImageResponseDto } from '@/catalog/dto/catalog-image.response.dto';
import { SaveExerciseDto } from './dto/save-exercise.dto';
import { SaveStretchDto } from './dto/save-stretch.dto';

const AUTHOR_INCLUDE = {
  author: { select: { sportProfile: { select: { displayName: true } } } },
} as const;

const EXERCISE_FORM_INCLUDE = {
  muscles: true,
  joints: true,
  ...AUTHOR_INCLUDE,
} satisfies Prisma.ExerciseInclude;

const LIST_INCLUDE = { _count: { select: { muscles: true } } } as const;

type ListRow = {
  id: number;
  name: string;
  code: string | null;
  imagePath: string | null;
  status: 'CATALOG' | 'DRAFT';
  _count: { muscles: number };
};

const words = (search?: string) =>
  normalizeName(search ?? '')
    .split(' ')
    .filter(Boolean)
    .map((word) => ({ nameNormalized: { contains: word } }));

/** Новая картинка сбрасывает кэш файла, уже загруженного в мессенджеры. */
const imageData = (imagePath: string | null | undefined) =>
  imagePath === undefined
    ? {}
    : { imagePath, imageTelegramFileId: null, imageMaxToken: null };

/**
 * Справочник в админке (frontend-tz, 14.1): списки с фильтрами «без картинки» и «без мышц»,
 * форма со всеми полями business-tz 5.2–5.3, загрузка картинки.
 */
@Injectable()
export class AdminCatalogService {
  private readonly logger = new Logger(`🛠 ${AdminCatalogService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadService,
    private readonly sender: BotSender,
  ) {}

  // ── Картинка ────────────────────────────────────────────────────────────

  /** Файл уже проверен и лежит в стейджинге — переносим в раздаваемый каталог справочника. */
  public image(file: Express.Multer.File): CatalogImageResponseDto {
    this.uploads.verifyImageSignatureOrThrow(file);
    const imagePath = this.uploads.commitToCategory(file.path, 'catalog');
    return { imagePath, imageUrl: this.uploads.toPublicUrl(imagePath)! };
  }

  // ── Упражнения ──────────────────────────────────────────────────────────

  public async exercises(query: AdminCatalogQueryDto) {
    const page = await paginatePrisma(this.prisma.exercise, {
      page: query.page,
      limit: query.limit,
      where: {
        AND: [
          ...words(query.search),
          ...(query.filter_noImage ? [{ imagePath: null }] : []),
          ...(query.filter_noMuscles ? [{ muscles: { none: {} } }] : []),
          ...(query.filter_status ? [{ status: query.filter_status }] : []),
          ...(query.filter_userMade ? [{ authorId: { not: null } }] : []),
        ],
      },
      orderBy: { name: 'asc' },
      include: LIST_INCLUDE,
    });
    return {
      items: this.listView(page.items as unknown as ListRow[]),
      meta: page.meta,
    };
  }

  public async exercise(id: number): Promise<AdminExerciseResponseDto> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: EXERCISE_FORM_INCLUDE,
    });
    if (!exercise) throw new NotFoundException('Упражнение не найдено.');
    return {
      id: exercise.id,
      name: exercise.name,
      code: exercise.code,
      technique: exercise.technique,
      steps: exercise.steps,
      mistakes: exercise.mistakes,
      videoUrl: exercise.videoUrl,
      equipment: exercise.equipment,
      measure: exercise.measure,
      imagePath: exercise.imagePath,
      imageUrl: this.uploads.toPublicUrl(exercise.imagePath),
      imageEndPath: exercise.imageEndPath,
      imageEndUrl: this.uploads.toPublicUrl(exercise.imageEndPath),
      primary: exercise.muscles
        .filter((m) => m.role === 'PRIMARY')
        .map((m) => m.muscleId),
      secondary: exercise.muscles
        .filter((m) => m.role === 'SECONDARY')
        .map((m) => m.muscleId),
      jointIds: exercise.joints.map((j) => j.jointId),
      status: exercise.status,
      author: exercise.author?.sportProfile?.displayName ?? null,
    };
  }

  public async createExercise(dto: SaveExerciseDto) {
    const exercise = await this.guard(() =>
      this.prisma.exercise.create({
        data: {
          ...this.exerciseFields(dto),
          ...imageData(dto.imagePath ?? null),
          status: 'CATALOG',
          muscles: { create: this.exerciseMuscles(dto) },
          joints: { create: dto.jointIds.map((jointId) => ({ jointId })) },
        },
      }),
    );
    this.logger.log(`Упражнение создано: exerciseId=${exercise.id}`);
    return this.exercise(exercise.id);
  }

  public async updateExercise(id: number, dto: SaveExerciseDto) {
    await this.guard(() =>
      this.prisma.exercise.update({
        where: { id },
        data: {
          ...this.exerciseFields(dto),
          ...imageData(dto.imagePath),
          muscles: { deleteMany: {}, create: this.exerciseMuscles(dto) },
          joints: {
            deleteMany: {},
            create: dto.jointIds.map((jointId) => ({ jointId })),
          },
        },
      }),
    );
    this.logger.log(`Упражнение изменено: exerciseId=${id}`);
    return this.exercise(id);
  }

  public async removeExercise(id: number): Promise<void> {
    await this.guard(
      () => this.prisma.exercise.delete({ where: { id } }),
      'Упражнение стоит в программах или тренировках — сними его с публикации вместо удаления.',
    );
    this.logger.log(`Упражнение удалено: exerciseId=${id}`);
  }

  // ── Растяжки ────────────────────────────────────────────────────────────

  public async stretches(query: AdminCatalogQueryDto) {
    const page = await paginatePrisma(this.prisma.stretch, {
      page: query.page,
      limit: query.limit,
      where: {
        AND: [
          ...words(query.search),
          ...(query.filter_noImage ? [{ imagePath: null }] : []),
          ...(query.filter_noMuscles ? [{ muscles: { none: {} } }] : []),
          ...(query.filter_status ? [{ status: query.filter_status }] : []),
          ...(query.filter_userMade ? [{ authorId: { not: null } }] : []),
        ],
      },
      orderBy: { name: 'asc' },
      include: LIST_INCLUDE,
    });
    return {
      items: this.listView(page.items as unknown as ListRow[]),
      meta: page.meta,
    };
  }

  public async stretch(id: number): Promise<AdminStretchResponseDto> {
    const stretch = await this.prisma.stretch.findUnique({
      where: { id },
      include: { muscles: true, ...AUTHOR_INCLUDE },
    });
    if (!stretch) throw new NotFoundException('Растяжка не найдена.');
    return {
      id: stretch.id,
      name: stretch.name,
      code: stretch.code,
      howTo: stretch.howTo,
      steps: stretch.steps,
      mistakes: stretch.mistakes,
      holdSeconds: stretch.holdSeconds,
      perSide: stretch.perSide,
      kind: stretch.kind,
      imagePath: stretch.imagePath,
      imageUrl: this.uploads.toPublicUrl(stretch.imagePath),
      imageEndPath: stretch.imageEndPath,
      imageEndUrl: this.uploads.toPublicUrl(stretch.imageEndPath),
      muscles: stretch.muscles.map((m) => m.muscleId),
      status: stretch.status,
      author: stretch.author?.sportProfile?.displayName ?? null,
    };
  }

  public async createStretch(dto: SaveStretchDto) {
    const stretch = await this.guard(() =>
      this.prisma.stretch.create({
        data: {
          ...this.stretchFields(dto),
          ...imageData(dto.imagePath ?? null),
          status: 'CATALOG',
          muscles: { create: dto.muscles.map((muscleId) => ({ muscleId })) },
        },
      }),
    );
    this.logger.log(`Растяжка создана: stretchId=${stretch.id}`);
    return this.stretch(stretch.id);
  }

  public async updateStretch(id: number, dto: SaveStretchDto) {
    await this.guard(() =>
      this.prisma.stretch.update({
        where: { id },
        data: {
          ...this.stretchFields(dto),
          ...imageData(dto.imagePath),
          muscles: {
            deleteMany: {},
            create: dto.muscles.map((muscleId) => ({ muscleId })),
          },
        },
      }),
    );
    this.logger.log(`Растяжка изменена: stretchId=${id}`);
    return this.stretch(id);
  }

  public async removeStretch(id: number): Promise<void> {
    await this.guard(
      () => this.prisma.stretch.delete({ where: { id } }),
      'Растяжка есть в заминках тренировок — сними её с публикации вместо удаления.',
    );
    this.logger.log(`Растяжка удалена: stretchId=${id}`);
  }

  // ── Публикация ──────────────────────────────────────────────────────────

  /**
   * Снять с публикации: запись пропадает из общего справочника, автор видит её как свою личную,
   * а там, где её уже поставили, она остаётся по ссылке.
   */
  public async unpublish(kind: CatalogKind, id: number): Promise<void> {
    const entry = await this.setStatus(kind, id, 'CATALOG', 'DRAFT');
    this.logger.log(`Снято с публикации: ${kind}Id=${id}`);
    if (entry.authorId)
      await this.sender.sendToUserId(
        entry.authorId,
        msg(
          `«${entry.name}» убран из общего справочника. У тебя он остаётся.`,
          [[appBtn(APP_SCREEN.mine)]],
        ),
      );
  }

  /** Вернуть в справочник без заявки — например, свою запись администратора без автора. */
  public async publish(kind: CatalogKind, id: number): Promise<void> {
    await this.setStatus(kind, id, 'DRAFT', 'CATALOG');
    this.logger.log(`Возвращено в справочник: ${kind}Id=${id}`);
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /** Смена статуса только из ожидаемого: повторное нажатие получает понятное «не найдено». */
  private async setStatus(
    kind: CatalogKind,
    id: number,
    from: 'CATALOG' | 'DRAFT',
    to: 'CATALOG' | 'DRAFT',
  ): Promise<{ name: string; authorId: number | null }> {
    const args = {
      where: { id, status: from },
      data: { status: to },
      select: { name: true, authorId: true },
    };
    try {
      return kind === 'exercise'
        ? await this.prisma.exercise.update(args)
        : await this.prisma.stretch.update(args);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException(
          from === 'CATALOG'
            ? 'Запись не опубликована.'
            : 'Запись уже в справочнике.',
        );
      throw error;
    }
  }

  private exerciseFields(dto: SaveExerciseDto) {
    return {
      name: dto.name,
      nameNormalized: normalizeName(dto.name),
      technique: dto.technique || null,
      steps: dto.steps,
      mistakes: dto.mistakes,
      imageEndPath: dto.imageEndPath,
      videoUrl: dto.videoUrl || null,
      equipment: dto.equipment ?? null,
      // Поля нет — мера не меняется (при создании берётся REPS по умолчанию)
      ...(dto.measure && { measure: dto.measure }),
    };
  }

  private exerciseMuscles(dto: SaveExerciseDto) {
    return [
      ...dto.primary.map((muscleId) => ({
        muscleId,
        role: 'PRIMARY' as const,
      })),
      ...dto.secondary
        .filter((id) => !dto.primary.includes(id))
        .map((muscleId) => ({ muscleId, role: 'SECONDARY' as const })),
    ];
  }

  private stretchFields(dto: SaveStretchDto) {
    return {
      name: dto.name,
      nameNormalized: normalizeName(dto.name),
      howTo: dto.howTo || null,
      steps: dto.steps,
      mistakes: dto.mistakes,
      imageEndPath: dto.imageEndPath,
      holdSeconds: dto.holdSeconds,
      perSide: dto.perSide,
      kind: dto.kind,
    };
  }

  private listView(rows: ListRow[]): AdminCatalogItemResponseDto[] {
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      imageUrl: this.uploads.toPublicUrl(row.imagePath),
      muscleCount: row._count.muscles,
      status: row.status,
    }));
  }

  /**
   * Ошибки Prisma — понятным текстом. inUse — для удаления: запись держат связи.
   * Без него нарушенная связь на create/update — это несуществующая мышца или сустав.
   */
  private async guard<T>(run: () => Promise<T>, inUse?: string): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025')
          throw new NotFoundException('Запись не найдена.');
        if (error.code === 'P2003')
          throw inUse
            ? new ConflictException(inUse)
            : new BadRequestException(
                'Неизвестная мышца или сустав — обнови экран.',
              );
        if (error.code === 'P2002')
          throw new ConflictException('Такая запись уже есть.');
      }
      throw error;
    }
  }
}
