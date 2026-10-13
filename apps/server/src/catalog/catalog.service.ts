import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'prisma/prisma.service';

import { BotChannelKey } from '@/bot';
import { paginatePrisma } from '@/common/prisma';
import { Joint, Muscle, Prisma } from '@/generated/prisma/client';

export const EXERCISE_INCLUDE = {
  muscles: { include: { muscle: true } },
  joints: { include: { joint: true } },
} satisfies Prisma.ExerciseInclude;

export const STRETCH_INCLUDE = {
  muscles: { include: { muscle: true } },
} satisfies Prisma.StretchInclude;

export type ExerciseFull = Prisma.ExerciseGetPayload<{
  include: typeof EXERCISE_INCLUDE;
}>;
export type StretchFull = Prisma.StretchGetPayload<{
  include: typeof STRETCH_INCLUDE;
}>;

export type CatalogKind = 'exercise' | 'stretch';

const PAGE_SIZE = 8;
const COMPLAINT_MAX = 500;

/** Нижний регистр, ё→е, без знаков — для поиска и подсказки дублей. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/g, ' ')
    .trim();
}

/** Абсолютный путь каталога загрузок (UPLOAD_DIR). */
export function uploadRoot(): string {
  const dir = process.env.UPLOAD_DIR?.trim() || 'uploads';
  return path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
}

function trigrams(value: string): Set<string> {
  const padded = `  ${value} `;
  const set = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) set.add(padded.slice(i, i + 3));
  return set;
}

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(`📚 ${CatalogService.name}`);
  /** Закрытые справочники меняются только сидом — держим в памяти. */
  private musclesCache: Muscle[] | null = null;
  private jointsCache: Joint[] | null = null;

  constructor(private readonly prisma: PrismaService) {}

  // ── Мышцы и суставы ─────────────────────────────────────────────────────

  public async muscles(): Promise<Muscle[]> {
    this.musclesCache ??= await this.prisma.muscle.findMany({
      orderBy: { bodyOrder: 'asc' },
    });
    return this.musclesCache;
  }

  public async joints(): Promise<Joint[]> {
    this.jointsCache ??= await this.prisma.joint.findMany({
      orderBy: { id: 'asc' },
    });
    return this.jointsCache;
  }

  // ── Упражнения ──────────────────────────────────────────────────────────

  /** Записи, видимые пользователю: общий справочник и его личные черновики. */
  public visibleExercises(userId: number): Prisma.ExerciseWhereInput {
    return {
      OR: [{ status: 'CATALOG' }, { status: 'DRAFT', authorId: userId }],
    };
  }

  public async findExercise(
    userId: number,
    id: number,
  ): Promise<ExerciseFull | null> {
    return this.prisma.exercise.findFirst({
      where: { id, ...this.visibleExercises(userId) },
      include: EXERCISE_INCLUDE,
    });
  }

  /** Поиск по названию: все слова запроса входят в nameNormalized. */
  public async searchExercises(userId: number, query: string) {
    const words = normalizeName(query).split(' ').filter(Boolean);
    if (!words.length) return [];
    return this.prisma.exercise.findMany({
      where: {
        AND: [
          this.visibleExercises(userId),
          ...words.map((word) => ({ nameNormalized: { contains: word } })),
        ],
      },
      orderBy: { name: 'asc' },
      take: 12,
    });
  }

  public async exercisesByMuscle(
    userId: number,
    muscleId: number,
    page: number,
  ) {
    return paginatePrisma(this.prisma.exercise, {
      page,
      limit: PAGE_SIZE,
      where: {
        ...this.visibleExercises(userId),
        muscles: { some: { muscleId, role: 'PRIMARY' } },
      },
      orderBy: { name: 'asc' },
    });
  }

  // ── Растяжки ────────────────────────────────────────────────────────────

  public visibleStretches(userId: number): Prisma.StretchWhereInput {
    return {
      OR: [{ status: 'CATALOG' }, { status: 'DRAFT', authorId: userId }],
    };
  }

  public async findStretch(
    userId: number,
    id: number,
  ): Promise<StretchFull | null> {
    return this.prisma.stretch.findFirst({
      where: { id, ...this.visibleStretches(userId) },
      include: STRETCH_INCLUDE,
    });
  }

  public async stretchesByMuscle(
    userId: number,
    muscleId: number,
    page: number,
  ) {
    return paginatePrisma(this.prisma.stretch, {
      page,
      limit: PAGE_SIZE,
      where: {
        ...this.visibleStretches(userId),
        muscles: { some: { muscleId } },
      },
      orderBy: { name: 'asc' },
    });
  }

  public async searchStretches(userId: number, query: string) {
    const words = normalizeName(query).split(' ').filter(Boolean);
    if (!words.length) return [];
    return this.prisma.stretch.findMany({
      where: {
        AND: [
          this.visibleStretches(userId),
          ...words.map((word) => ({ nameNormalized: { contains: word } })),
        ],
      },
      orderBy: { name: 'asc' },
      take: 12,
    });
  }

  // ── Подсказка дублей ────────────────────────────────────────────────────

  /**
   * «Возможно, ты искал…»: до 5 записей справочника с наибольшей долей общих триграмм, порог 0,4.
   * Считается в коде: записей порядка сотни, расширение БД не нужно.
   */
  public async similar(
    kind: CatalogKind,
    name: string,
  ): Promise<{ id: number; name: string }[]> {
    const target = trigrams(normalizeName(name));
    const select = { id: true, name: true, nameNormalized: true };
    const rows =
      kind === 'exercise'
        ? await this.prisma.exercise.findMany({
            where: { status: 'CATALOG' },
            select,
          })
        : await this.prisma.stretch.findMany({
            where: { status: 'CATALOG' },
            select,
          });
    return rows
      .map((row) => {
        const own = trigrams(row.nameNormalized);
        let common = 0;
        for (const gram of target) if (own.has(gram)) common++;
        return { row, score: common / (target.size + own.size - common) };
      })
      .filter((item) => item.score >= 0.4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => ({ id: item.row.id, name: item.row.name }));
  }

  // ── Картинки ────────────────────────────────────────────────────────────

  /** Картинка записи для отправки в мессенджер: путь и кэш уже загруженного файла. */
  public imageOf(
    entity: {
      imagePath: string | null;
      imageTelegramFileId: string | null;
      imageMaxToken: string | null;
    },
    channel: BotChannelKey,
  ): { path: string; cachedId?: string } | undefined {
    if (!entity.imagePath) return undefined;
    const file = path.resolve(uploadRoot(), entity.imagePath);
    if (!fs.existsSync(file)) {
      this.logger.warn(`Файл картинки не найден: ${entity.imagePath}`);
      return undefined;
    }
    const cachedId =
      channel === 'TELEGRAM'
        ? entity.imageTelegramFileId
        : entity.imageMaxToken;
    return { path: file, cachedId: cachedId ?? undefined };
  }

  /** Запомнить id загруженной картинки — повторная отправка пойдёт без загрузки файла. */
  public async rememberImage(
    kind: CatalogKind,
    id: number,
    channel: BotChannelKey,
    imageId: string | undefined,
  ): Promise<void> {
    if (!imageId) return;
    const data =
      channel === 'TELEGRAM'
        ? { imageTelegramFileId: imageId }
        : { imageMaxToken: imageId };
    if (kind === 'exercise')
      await this.prisma.exercise.updateMany({ where: { id }, data });
    else await this.prisma.stretch.updateMany({ where: { id }, data });
    this.logger.debug(`Кэш картинки сохранён: ${kind} id=${id}, ${channel}`);
  }

  // ── Жалобы ──────────────────────────────────────────────────────────────

  public async createComplaint(
    userId: number,
    kind: CatalogKind,
    id: number,
    text: string,
  ) {
    const trimmed = text.trim();
    if (!trimmed) throw new BadRequestException('Напиши, что не так.');
    if (trimmed.length > COMPLAINT_MAX)
      throw new BadRequestException(
        `Слишком длинно: до ${COMPLAINT_MAX} символов.`,
      );
    const complaint = await this.prisma.complaint.create({
      data: {
        userId,
        text: trimmed,
        ...(kind === 'exercise' ? { exerciseId: id } : { stretchId: id }),
      },
      include: {
        exercise: { select: { name: true } },
        stretch: { select: { name: true } },
        user: { select: { sportProfile: { select: { displayName: true } } } },
      },
    });
    this.logger.log(
      `Жалоба создана: complaintId=${complaint.id}, ${kind} id=${id}, userId=${userId}`,
    );
    return complaint;
  }
}
