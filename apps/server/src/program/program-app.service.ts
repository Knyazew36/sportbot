import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { Prisma } from '@/generated/prisma/client';
import { PROGRAM_TAG_SELECT } from '@/program-tag/program-tag.service';

import { ProgramListItemResponseDto } from './dto/program-list-item.response.dto';
import { ProgramResponseDto } from './dto/program.response.dto';
import { UpdateComplexDto } from './dto/update-complex.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import {
  ownerWhere,
  ProgramOwner,
  ProgramService,
  TEMPLATES,
} from './program.service';

const VIEW_INCLUDE = {
  tags: { orderBy: { position: 'asc' }, select: PROGRAM_TAG_SELECT },
  complexes: {
    orderBy: { position: 'asc' },
    include: {
      exercises: {
        orderBy: { position: 'asc' },
        include: {
          exercise: { include: { muscles: { include: { muscle: true } } } },
        },
      },
    },
  },
  sourceProgram: {
    select: {
      isTemplate: true,
      contentUpdatedAt: true,
      owner: { select: { sportProfile: { select: { displayName: true } } } },
    },
  },
} satisfies Prisma.ProgramInclude;

type ProgramView = Prisma.ProgramGetPayload<{ include: typeof VIEW_INCLUDE }>;

/** Всё, что нужно, чтобы понять, копия ли это программы друга и обновил ли он её. */
type WithSource = Pick<ProgramView, 'sourceProgram' | 'sourceSyncedAt'>;

const LIST_INCLUDE = {
  _count: { select: { complexes: true } },
  sourceProgram: VIEW_INCLUDE.sourceProgram,
} satisfies Prisma.ProgramInclude;

/** Имя друга, с чьей программы снята копия; копия шаблона — не от друга. */
const friendName = (program: WithSource): string | null =>
  program.sourceProgram && !program.sourceProgram.isTemplate
    ? (program.sourceProgram.owner?.sportProfile?.displayName ?? 'друга')
    : null;

/** Друг поменял состав после того, как программу скопировали (business-tz, 10.1). */
const sourceUpdated = (program: WithSource): boolean =>
  !!program.sourceProgram &&
  !program.sourceProgram.isTemplate &&
  !!program.sourceSyncedAt &&
  program.sourceProgram.contentUpdatedAt > program.sourceSyncedAt;

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
      sourceUpdated: sourceUpdated(p),
    }));
  }

  /** Шаблоны с составом комплексов — их немного, отдаём целиком. */
  public async templates(): Promise<ProgramResponseDto[]> {
    const templates = await this.prisma.program.findMany({
      where: { isTemplate: true },
      orderBy: { id: 'asc' },
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

  /** Новый шаблон администратора: без владельца, с описанием и тегами (frontend-tz, 14.2). */
  public async createTemplate(dto: {
    name: string;
    description?: string;
    tagIds?: number[];
  }) {
    const template = await this.withKnownTags(() =>
      this.prisma.program.create({
        data: {
          name: dto.name,
          isTemplate: true,
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
    const template = await this.prisma.program.findFirst({
      where: { id: templateId, isTemplate: true },
      select: { id: true },
    });
    if (!template) throw new NotFoundException('Шаблон не найден.');
    const copy = await this.programs.copy(template.id, userId);
    return this.view(userId, copy.id);
  }

  public async update(
    owner: ProgramOwner,
    programId: number,
    dto: UpdateProgramDto & { tagIds?: number[] },
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

  /** «Обновить у себя»: копия заменяется текущей версией друга, свои правки пропадают. */
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
  ): ProgramResponseDto {
    return {
      id: program.id,
      name: program.name,
      description: program.description,
      active: program.id === activeProgramId,
      fromFriend: friendName(program),
      sourceUpdated: sourceUpdated(program),
      tags: program.tags,
      complexes: program.complexes.map((c) => ({
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
      })),
    };
  }
}
