import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { normalizeName } from '@/catalog/catalog.service';
import { Prisma } from '@/generated/prisma/client';
import {
  PROGRAM_TAG_ORDER,
  PROGRAM_TAG_SELECT,
} from '@/program-tag/program-tag.service';

import { ProgramListItemResponseDto } from './dto/program-list-item.response.dto';
import { ProgramResponseDto } from './dto/program.response.dto';
import { TemplatesQueryDto } from './dto/templates-query.dto';
import { UpdateComplexDto } from './dto/update-complex.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import {
  ownerWhere,
  ProgramOwner,
  ProgramService,
  PUBLISHED_TEMPLATE,
  TEMPLATE_ORDER,
  TEMPLATES,
} from './program.service';

/** Состав программы: комплексы и упражнения по порядку. Нужен и экрану программы, и профилю друга. */
export const COMPLEXES_INCLUDE = {
  orderBy: { position: 'asc' },
  include: {
    exercises: {
      orderBy: { position: 'asc' },
      include: {
        exercise: { include: { muscles: { include: { muscle: true } } } },
      },
    },
  },
} satisfies Prisma.Program$complexesArgs;

type ComplexView = Prisma.ProgramComplexGetPayload<{
  include: typeof COMPLEXES_INCLUDE.include;
}>;

export const toComplexesDto = (
  complexes: ComplexView[],
  nextComplexId: number | null,
): ProgramComplexResponseDto[] =>
  complexes.map((c) => ({
    id: c.id,
    name: c.name,
    position: c.position,
    cardioName: c.cardioName,
    cardioMinutes: c.cardioMinutes,
    isNext: c.id === nextComplexId,
    exercises: c.exercises.map((item) => ({
      id: item.id,
      exerciseId: item.exerciseId,
      name: item.exercise.name,
      muscles: item.exercise.muscles
        .filter((m) => m.role === 'PRIMARY')
        .map((m) => m.muscle.name)
        .join(' · '),
      draft: item.exercise.status === 'DRAFT',
      sets: item.sets,
      repsMin: item.repsMin,
      repsMax: item.repsMax,
    })),
  }));

const VIEW_INCLUDE = {
  tags: { orderBy: PROGRAM_TAG_ORDER, select: PROGRAM_TAG_SELECT },
  complexes: COMPLEXES_INCLUDE,
  sourceProgram: {
    select: {
      isTemplate: true,
      isPublished: true,
      contentUpdatedAt: true,
      owner: { select: { sportProfile: { select: { displayName: true } } } },
    },
  },
} satisfies Prisma.ProgramInclude;

type ProgramView = Prisma.ProgramGetPayload<{ include: typeof VIEW_INCLUDE }>;

/** Всё, что нужно, чтобы понять, чья это копия и обновился ли источник. */
type WithSource = Pick<
  ProgramView,
  'sourceProgram' | 'sourceSyncedAt' | 'sourceDismissedAt'
>;

const LIST_INCLUDE = {
  _count: { select: { complexes: true } },
  sourceProgram: VIEW_INCLUDE.sourceProgram,
} satisfies Prisma.ProgramInclude;

/** Имя друга, с чьей программы снята копия; копия шаблона — не от друга. */
const friendName = (program: WithSource): string | null =>
  program.sourceProgram && !program.sourceProgram.isTemplate
    ? (program.sourceProgram.owner?.sportProfile?.displayName ?? 'друга')
    : null;

const fromTemplate = (program: WithSource): boolean =>
  !!program.sourceProgram?.isTemplate;

/**
 * Друг или админ поменял источник после копирования (business-tz, 10.1). «Не сейчас» прячет
 * плашку до следующей правки источника.
 */
const sourceUpdated = (program: WithSource): boolean => {
  const source = program.sourceProgram;
  if (!source || !program.sourceSyncedAt) return false;
  // Снятый с публикации шаблон админ, скорее всего, ещё правит — не зовём обновляться
  if (source.isTemplate && !source.isPublished) return false;
  const seen =
    program.sourceDismissedAt &&
    program.sourceDismissedAt > program.sourceSyncedAt
      ? program.sourceDismissedAt
      : program.sourceSyncedAt;
  return source.contentUpdatedAt > seen;
};

/**
 * Программы и шаблоны в Mini App (frontend-tz, 10 и 14.2). Один код для программы пользователя
 * и шаблона админа — различает их owner. Каждая правка отвечает программой целиком.
 */
@Injectable()
export class ProgramAppService {
  private readonly logger = new Logger(`📋 ${ProgramAppService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly programs: ProgramService,
  ) {}

  // ── Списки ──────────────────────────────────────────────────────────────

  public async list(userId: number): Promise<ProgramListItemResponseDto[]> {
    const [programs, profile] = await Promise.all([
      this.prisma.program.findMany({
        where: { ownerId: userId },
        orderBy: { id: 'asc' },
        include: LIST_INCLUDE,
      }),
      this.prisma.sportProfile.findUnique({
        where: { userId },
        select: { activeProgramId: true },
      }),
    ]);
    this.logger.debug(`Программы: userId=${userId}, всего=${programs.length}`);
    return programs.map((p) => ({
      id: p.id,
      name: p.name,
      complexCount: p._count.complexes,
      active: p.id === profile?.activeProgramId,
      fromFriend: friendName(p),
      fromTemplate: fromTemplate(p),
      sourceUpdated: sourceUpdated(p),
    }));
  }

  /**
   * Каталог: опубликованные шаблоны с составом в ручном порядке. Теги — внутри группы любой,
   * между группами все. Шаблонов немного, поэтому без пагинации.
   */
  public async catalog(
    userId: number,
    query: TemplatesQueryDto,
  ): Promise<ProgramResponseDto[]> {
    const tagGroups = await this.groupTags(query.filter_tags ?? []);
    const templates = await this.prisma.program.findMany({
      where: {
        ...PUBLISHED_TEMPLATE,
        AND: tagGroups.map((ids) => ({ tags: { some: { id: { in: ids } } } })),
      },
      orderBy: TEMPLATE_ORDER,
      include: {
        ...VIEW_INCLUDE,
        copies: {
          where: { ownerId: userId },
          orderBy: { id: 'desc' },
          take: 1,
          select: { id: true },
        },
      },
    });
    // Поиск без учёта регистра и ё: в SQL так не сравнить, а шаблонов немного — отбираем здесь
    const words = normalizeName(query.filter_search ?? '')
      .split(' ')
      .filter(Boolean);
    const found = words.length
      ? templates.filter((t) => {
          const text = normalizeName(`${t.name} ${t.description ?? ''}`);
          return words.every((word) => text.includes(word));
        })
      : templates;
    this.logger.debug(
      `Каталог: userId=${userId}, теги=[${(query.filter_tags ?? []).join(',')}], поиск=«${query.filter_search ?? ''}», найдено=${found.length}`,
    );
    return found.map((t) => this.toDto(t, null, null, t.copies[0]?.id ?? null));
  }

  /** Все шаблоны для админки, скрытые тоже, в порядке каталога. */
  public async adminTemplates(): Promise<ProgramResponseDto[]> {
    const templates = await this.prisma.program.findMany({
      where: { isTemplate: true },
      orderBy: TEMPLATE_ORDER,
      include: VIEW_INCLUDE,
    });
    return templates.map((t) => this.toDto(t, null, null));
  }

  public async view(
    owner: ProgramOwner,
    programId: number,
  ): Promise<ProgramResponseDto> {
    const program = await this.prisma.program.findFirst({
      where: { id: programId, ...ownerWhere(owner) },
      include: VIEW_INCLUDE,
    });
    if (!program) throw new NotFoundException('Программа не найдена.');
    if (owner === TEMPLATES) return this.toDto(program, null, null);
    const profile = await this.prisma.sportProfile.findUnique({
      where: { userId: owner },
      select: { activeProgramId: true },
    });
    const active = profile?.activeProgramId === program.id;
    // Указатель очереди чинится тут же, если комплекс под ним удалили
    const next = active ? await this.programs.nextComplex(owner) : null;
    return this.toDto(
      program,
      profile?.activeProgramId ?? null,
      next?.id ?? null,
    );
  }

  // ── Программа ───────────────────────────────────────────────────────────

  public async create(userId: number, name: string) {
    const program = await this.programs.create(userId, name);
    return this.view(userId, program.id);
  }

  /**
   * Новый шаблон администратора: без владельца, с описанием и тегами (frontend-tz, 14.2).
   * Скрыт, пока его не опубликуют: недособранный шаблон в каталог не попадает.
   */
  public async createTemplate(dto: {
    name: string;
    description?: string;
    tagIds?: number[];
  }) {
    const last = await this.prisma.program.aggregate({
      where: { isTemplate: true },
      _max: { position: true },
    });
    const template = await this.withKnownTags(() =>
      this.prisma.program.create({
        data: {
          name: dto.name,
          isTemplate: true,
          position: (last._max.position ?? 0) + 1,
          description: dto.description?.trim() || null,
          tags: { connect: (dto.tagIds ?? []).map((id) => ({ id })) },
        },
      }),
    );
    this.logger.log(
      `Шаблон создан: programId=${template.id}, теги=[${(dto.tagIds ?? []).join(',')}]`,
    );
    return this.view(TEMPLATES, template.id);
  }

  /** «Взять» шаблон: копия в программах пользователя. */
  public async take(userId: number, templateId: number) {
    const copy = await this.programs.takeTemplate(templateId, userId);
    return this.view(userId, copy.id);
  }

  /** «Из моей программы» в админке: скрытый шаблон с составом своей программы. */
  public async templateFromProgram(userId: number, programId: number) {
    const template = await this.programs.copyToTemplate(userId, programId);
    return this.view(TEMPLATES, template.id);
  }

  /** ids — все шаблоны, скрытые тоже, в новом порядке каталога. */
  public async reorderTemplates(ids: number[]): Promise<ProgramResponseDto[]> {
    const existing = await this.prisma.program.findMany({
      where: { isTemplate: true },
      select: { id: true },
    });
    const known = new Set(existing.map((t) => t.id));
    if (
      ids.length !== known.size ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !known.has(id))
    ) {
      this.logger.warn(
        `Порядок шаблонов не совпал со списком: [${ids.join(',')}]`,
      );
      throw new BadRequestException(
        'Список шаблонов устарел — обнови экран и попробуй ещё раз.',
      );
    }
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.program.update({
          where: { id },
          data: { position: index + 1 },
        }),
      ),
    );
    this.logger.log(`Порядок шаблонов: [${ids.join(',')}]`);
    return this.adminTemplates();
  }

  /**
   * Шаблон, который уже брали, не удаляется: у взявших пропали бы «уже у тебя» и обновления.
   * Такой шаблон снимают с публикации.
   */
  public async removeTemplate(templateId: number): Promise<void> {
    const { count } = await this.prisma.program.deleteMany({
      where: { id: templateId, isTemplate: true, copies: { none: {} } },
    });
    if (count) {
      this.logger.log(`Шаблон удалён: templateId=${templateId}`);
      return;
    }
    // Удалить не вышло: шаблона нет или его уже брали — различаем только для текста ошибки
    const copies = await this.prisma.program.count({
      where: {
        sourceProgramId: templateId,
        sourceProgram: { isTemplate: true },
      },
    });
    if (!copies) throw new NotFoundException('Шаблон не найден.');
    this.logger.warn(
      `Удаление шаблона с копиями: templateId=${templateId}, копий=${copies}`,
    );
    throw new ConflictException(
      `Шаблон уже взяли (${copies}) — его можно только снять с публикации.`,
    );
  }

  /** «Не сейчас» на плашке обновления: вернётся после следующей правки источника. */
  public async dismissUpdate(userId: number, programId: number) {
    const { count } = await this.prisma.program.updateMany({
      where: { id: programId, ownerId: userId, sourceProgramId: { not: null } },
      data: { sourceDismissedAt: new Date() },
    });
    if (!count) throw new NotFoundException('Программа не найдена.');
    this.logger.log(
      `Обновление источника отложено: programId=${programId}, userId=${userId}`,
    );
    return this.view(userId, programId);
  }

  public async update(
    owner: ProgramOwner,
    programId: number,
    dto: UpdateProgramDto & { tagIds?: number[]; isPublished?: boolean },
  ) {
    if (dto.name !== undefined)
      await this.programs.rename(owner, programId, dto.name);
    // Описание — только у шаблона: у программы пользователя его нет на экране
    if (owner === TEMPLATES && dto.description !== undefined) {
      await this.prisma.program.updateMany({
        where: { id: programId, isTemplate: true },
        data: { description: dto.description.trim() || null },
      });
      this.logger.log(`Описание шаблона: programId=${programId}`);
    }
    if (owner === TEMPLATES && dto.isPublished !== undefined) {
      await this.prisma.program.updateMany({
        where: { id: programId, isTemplate: true },
        data: { isPublished: dto.isPublished },
      });
      this.logger.log(
        `Публикация шаблона: programId=${programId}, опубликован=${dto.isPublished}`,
      );
    }
    // Теги — только у шаблона: витрина, а не свойство программы пользователя
    if (owner === TEMPLATES && dto.tagIds !== undefined) {
      const tagIds = dto.tagIds;
      await this.withKnownTags(() =>
        this.prisma.program.update({
          where: { id: programId, isTemplate: true },
          data: { tags: { set: tagIds.map((id) => ({ id })) } },
        }),
      );
      this.logger.log(
        `Теги шаблона: programId=${programId}, [${tagIds.join(',')}]`,
      );
    }
    return this.view(owner, programId);
  }

  /** Удаление программы: история тренировок остаётся — она ссылается на упражнения. */
  public async remove(owner: ProgramOwner, programId: number): Promise<void> {
    await this.programs.remove(owner, programId);
  }

  public async activate(userId: number, programId: number) {
    await this.programs.setActive(userId, programId);
    return this.view(userId, programId);
  }

  /** «Обновить у себя»: копия заменяется текущей версией друга или шаблона, свои правки пропадают. */
  public async resync(userId: number, programId: number) {
    await this.programs.resync(userId, programId);
    return this.view(userId, programId);
  }

  // ── Комплексы ───────────────────────────────────────────────────────────

  public async addComplex(
    owner: ProgramOwner,
    programId: number,
    name: string,
  ) {
    await this.programs.addComplex(owner, programId, name);
    return this.view(owner, programId);
  }

  public async updateComplex(
    owner: ProgramOwner,
    complexId: number,
    dto: UpdateComplexDto,
  ) {
    const complex = await this.programs.findComplex(owner, complexId);
    if (dto.name !== undefined)
      await this.programs.renameComplex(owner, complexId, dto.name);
    if (dto.cardioName !== undefined || dto.cardioMinutes !== undefined)
      await this.programs.setCardioValues(
        owner,
        complexId,
        dto.cardioName === undefined ? complex.cardioName : dto.cardioName,
        dto.cardioMinutes === undefined
          ? complex.cardioMinutes
          : dto.cardioMinutes,
      );
    return this.view(owner, complex.programId);
  }

  public async removeComplex(owner: ProgramOwner, complexId: number) {
    const programId = await this.programs.removeComplex(owner, complexId);
    return this.view(owner, programId);
  }

  public async reorderComplexes(
    owner: ProgramOwner,
    programId: number,
    ids: number[],
  ) {
    await this.programs.reorderComplexes(owner, programId, ids);
    return this.view(owner, programId);
  }

  // ── Упражнения комплекса ────────────────────────────────────────────────

  /** Подбор из справочника: несколько упражнений сразу; уже стоящие в комплексе пропускаются. */
  public async addExercises(
    owner: ProgramOwner,
    complexId: number,
    exerciseIds: number[],
  ) {
    const complex = await this.programs.findComplex(owner, complexId);
    const present = new Set(complex.exercises.map((e) => e.exerciseId));
    const fresh = [...new Set(exerciseIds)].filter((id) => !present.has(id));
    if (!fresh.length)
      throw new BadRequestException('Эти упражнения уже есть в комплексе.');
    for (const exerciseId of fresh)
      await this.programs.addExercise(owner, complexId, exerciseId);
    return this.view(owner, complex.programId);
  }

  public async updateItem(
    owner: ProgramOwner,
    itemId: number,
    plan: { sets: number; repsMin: number; repsMax: number },
  ) {
    const item = await this.programs.updatePlan(owner, itemId, plan);
    return this.view(owner, item.complex.programId);
  }

  public async removeItem(owner: ProgramOwner, itemId: number) {
    const item = await this.programs.findItem(owner, itemId);
    await this.programs.removeItem(owner, itemId);
    return this.view(owner, item.complex.programId);
  }

  public async reorderItems(
    owner: ProgramOwner,
    complexId: number,
    ids: number[],
  ) {
    const programId = await this.programs.reorderItems(owner, complexId, ids);
    return this.view(owner, programId);
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /** Выбранные теги по группам: каждая группа — отдельное условие «И». Неизвестные id отбрасываются. */
  private async groupTags(tagIds: number[]): Promise<number[][]> {
    if (!tagIds.length) return [];
    const tags = await this.prisma.programTag.findMany({
      where: { id: { in: tagIds } },
      select: { id: true, groupId: true },
    });
    const byGroup = new Map<number, number[]>();
    for (const tag of tags)
      byGroup.set(tag.groupId, [...(byGroup.get(tag.groupId) ?? []), tag.id]);
    return [...byGroup.values()];
  }

  /** Связь с несуществующим тегом Prisma отдаёт как P2025 — это устаревший экран админа. */
  private async withKnownTags<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(
          `Привязка к несуществующему тегу или шаблону: ${error.message}`,
        );
        throw new BadRequestException(
          'Тег или шаблон не найден — обнови экран.',
        );
      }
      throw error;
    }
  }

  private toDto(
    program: ProgramView,
    activeProgramId: number | null,
    nextComplexId: number | null,
    takenProgramId: number | null = null,
  ): ProgramResponseDto {
    return {
      id: program.id,
      name: program.name,
      description: program.description,
      active: program.id === activeProgramId,
      fromFriend: friendName(program),
      fromTemplate: fromTemplate(program),
      sourceUpdated: sourceUpdated(program),
      isPublished: program.isPublished,
      takenProgramId,
      tags: program.tags,
      complexes: toComplexesDto(program.complexes, nextComplexId),
    };
  }
}
