import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { BotSender } from '@/bot';
import { paginatePrisma } from '@/common/prisma';
import { Prisma } from '@/generated/prisma/client';
import { UploadService } from '@/upload/upload.service';

import {
  CatalogKind,
  CatalogService,
  EXERCISE_INCLUDE,
  normalizeName,
  STRETCH_INCLUDE,
} from './catalog.service';
import { CatalogExerciseResponseDto } from './dto/catalog-exercise.response.dto';
import { CatalogListItemResponseDto } from './dto/catalog-list-item.response.dto';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { CatalogRefResponseDto } from './dto/catalog-ref.response.dto';
import { CatalogStretchResponseDto } from './dto/catalog-stretch.response.dto';
import { ComplaintCreatedResponseDto } from './dto/complaint-created.response.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';

const LIST_EXERCISE_INCLUDE = {
  muscles: { include: { muscle: true } },
} satisfies Prisma.ExerciseInclude;

type ExerciseRow = Prisma.ExerciseGetPayload<{
  include: typeof LIST_EXERCISE_INCLUDE;
}>;
type StretchRow = Prisma.StretchGetPayload<{ include: typeof STRETCH_INCLUDE }>;

type MuscleLink = { role?: string; muscle: CatalogRefResponseDto };

const ref = (item: { id: number; code: string; name: string }) => ({
  id: item.id,
  code: item.code,
  name: item.name,
});

const names = (muscles: MuscleLink[], onlyPrimary: boolean): string =>
  muscles
    .filter((m) => !onlyPrimary || m.role === 'PRIMARY')
    .map((m) => m.muscle.name)
    .join(' · ');

/** Слова запроса — все должны входить в название (как поиск в боте). */
const nameWords = (search?: string) =>
  normalizeName(search ?? '')
    .split(' ')
    .filter(Boolean)
    .map((word) => ({ nameNormalized: { contains: word } }));

/** Справочник в Mini App (frontend-tz, 11): поиск с фильтрами, карточки, жалобы. */
@Injectable()
export class CatalogAppService {
  private readonly logger = new Logger(`📚 ${CatalogAppService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly uploads: UploadService,
    private readonly sender: BotSender,
  ) {}

  // ── Справочники ─────────────────────────────────────────────────────────

  public async muscles(): Promise<CatalogRefResponseDto[]> {
    return (await this.catalog.muscles()).map(ref);
  }

  public async joints(): Promise<CatalogRefResponseDto[]> {
    return (await this.catalog.joints()).map(ref);
  }

  // ── Упражнения ──────────────────────────────────────────────────────────

  /** Выдача: общий справочник и свои черновики; поиск по словам названия, мышца, инвентарь. */
  public async exercises(userId: number, query: CatalogQueryDto) {
    const where: Prisma.ExerciseWhereInput = {
      AND: [
        this.catalog.visibleExercises(userId),
        ...nameWords(query.search),
        ...(query.filter_muscle
          ? [
              {
                muscles: {
                  some: {
                    muscleId: query.filter_muscle,
                    role: 'PRIMARY' as const,
                  },
                },
              },
            ]
          : []),
        ...(query.filter_equipment
          ? [{ equipment: query.filter_equipment }]
          : []),
      ],
    };
    const page = await paginatePrisma(this.prisma.exercise, {
      page: query.page,
      limit: query.limit,
      where,
      include: LIST_EXERCISE_INCLUDE,
      orderBy: { name: 'asc' },
    });
    this.logger.debug(
      `Упражнения: userId=${userId}, найдено=${page.meta.total}, стр.${page.meta.page}`,
    );
    return {
      items: (page.items as unknown as ExerciseRow[]).map(
        (e): CatalogListItemResponseDto => ({
          id: e.id,
          name: e.name,
          muscles: names(e.muscles, true),
          imageUrl: this.uploads.toPublicUrl(e.imagePath),
          equipment: e.equipment,
          holdSeconds: null,
          draft: e.status === 'DRAFT',
        }),
      ),
      meta: page.meta,
    };
  }

  public async exercise(
    userId: number,
    id: number,
  ): Promise<CatalogExerciseResponseDto> {
    const exercise = await this.prisma.exercise.findFirst({
      where: { id, ...this.catalog.visibleExercises(userId) },
      include: EXERCISE_INCLUDE,
    });
    if (!exercise) throw new NotFoundException('Упражнение не найдено.');
    return {
      id: exercise.id,
      name: exercise.name,
      imageUrl: this.uploads.toPublicUrl(exercise.imagePath),
      technique: exercise.technique,
      videoUrl: exercise.videoUrl,
      equipment: exercise.equipment,
      primaryMuscles: exercise.muscles
        .filter((m) => m.role === 'PRIMARY')
        .map((m) => ref(m.muscle)),
      secondaryMuscles: exercise.muscles
        .filter((m) => m.role === 'SECONDARY')
        .map((m) => ref(m.muscle)),
      joints: exercise.joints.map((j) => ref(j.joint)),
      draft: exercise.status === 'DRAFT',
    };
  }

  // ── Растяжки ────────────────────────────────────────────────────────────

  public async stretches(userId: number, query: CatalogQueryDto) {
    const where: Prisma.StretchWhereInput = {
      AND: [
        this.catalog.visibleStretches(userId),
        ...nameWords(query.search),
        ...(query.filter_muscle
          ? [{ muscles: { some: { muscleId: query.filter_muscle } } }]
          : []),
      ],
    };
    const page = await paginatePrisma(this.prisma.stretch, {
      page: query.page,
      limit: query.limit,
      where,
      include: STRETCH_INCLUDE,
      orderBy: { name: 'asc' },
    });
    return {
      items: (page.items as unknown as StretchRow[]).map(
        (s): CatalogListItemResponseDto => ({
          id: s.id,
          name: s.name,
          muscles: names(s.muscles, false),
          imageUrl: this.uploads.toPublicUrl(s.imagePath),
          equipment: null,
          holdSeconds: s.holdSeconds,
          draft: s.status === 'DRAFT',
        }),
      ),
      meta: page.meta,
    };
  }

  public async stretch(
    userId: number,
    id: number,
  ): Promise<CatalogStretchResponseDto> {
    const stretch = await this.catalog.findStretch(userId, id);
    if (!stretch) throw new NotFoundException('Растяжка не найдена.');
    return {
      id: stretch.id,
      name: stretch.name,
      imageUrl: this.uploads.toPublicUrl(stretch.imagePath),
      howTo: stretch.howTo,
      holdSeconds: stretch.holdSeconds,
      perSide: stretch.perSide,
      muscles: stretch.muscles.map((m) => ref(m.muscle)),
      draft: stretch.status === 'DRAFT',
    };
  }

  // ── Подсказка и жалобы ──────────────────────────────────────────────────

  /** «Возможно, ты искал…» при вводе названия своей записи. */
  public similar(kind: CatalogKind, name: string) {
    return this.catalog.similar(kind, name);
  }

  /** «Ошибка в описании»: жалоба уходит администраторам в бот (business-tz, 5.7). */
  public async complain(
    userId: number,
    dto: CreateComplaintDto,
  ): Promise<ComplaintCreatedResponseDto> {
    const target =
      dto.kind === 'exercise'
        ? await this.catalog.findExercise(userId, dto.id)
        : await this.catalog.findStretch(userId, dto.id);
    if (!target) throw new NotFoundException('Запись не найдена.');
    const complaint = await this.catalog.createComplaint(
      userId,
      dto.kind,
      dto.id,
      dto.text,
    );
    await this.sender.sendToAdmins(this.catalog.complaintMessage(complaint));
    return { id: complaint.id };
  }
}
