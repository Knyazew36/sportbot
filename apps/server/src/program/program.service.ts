import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from 'prisma/prisma.service';

import {
  defaultPlan,
  isTimed,
  MEASURE_LIMITS,
  parseTime,
} from '@/catalog/measure';
import { ExerciseMeasure, Prisma } from '@/generated/prisma/client';
import {
  PROGRAM_TAG_ORDER,
  PROGRAM_TAG_SELECT,
} from '@/program-tag/program-tag.service';

import { localToday } from '@/bot/bot-time';
import { stampFields } from '@/sync/field-stamps';
import { normalizeSupersets, SupersetSlot } from './superset';

type Tx = Prisma.TransactionClient;

export const PROGRAM_INCLUDE = {
  complexes: {
    orderBy: { position: 'asc' },
    include: {
      exercises: {
        orderBy: { position: 'asc' },
        include: { exercise: true },
      },
    },
  },
} satisfies Prisma.ProgramInclude;

export const COMPLEX_INCLUDE = {
  program: true,
  exercises: {
    orderBy: { position: 'asc' },
    include: {
      exercise: {
        include: {
          muscles: { include: { muscle: true } },
          joints: { include: { joint: true } },
        },
      },
    },
  },
} satisfies Prisma.ComplexInclude;

export type ProgramFull = Prisma.ProgramGetPayload<{
  include: typeof PROGRAM_INCLUDE;
}>;
export type ComplexFull = Prisma.ComplexGetPayload<{
  include: typeof COMPLEX_INCLUDE;
}>;

/** Шаблоны программ правит администратор: у них нет владельца. */
export const TEMPLATES = 'templates' as const;
/** Чью программу правим: пользователя (его id) или шаблон. */
export type ProgramOwner = number | typeof TEMPLATES;

export const ownerWhere = (owner: ProgramOwner): Prisma.ProgramWhereInput =>
  owner === TEMPLATES ? { isTemplate: true } : { ownerId: owner };

/** Шаблон, который видят пользователи: каталог, онбординг, бот. */
export const PUBLISHED_TEMPLATE = {
  isTemplate: true,
  isPublished: true,
} satisfies Prisma.ProgramWhereInput;

/** Программа пользователя, одобренная в каталог «Программы пользователей». */
export const PUBLISHED_USER_PROGRAM = {
  isTemplate: false,
  publication: 'PUBLISHED',
} satisfies Prisma.ProgramWhereInput;

/** Порядок шаблонов в каталоге — ручной, из админки. */
export const TEMPLATE_ORDER = [
  { position: 'asc' },
  { id: 'asc' },
] satisfies Prisma.ProgramOrderByWithRelationInput[];

/** Упражнение, которое можно поставить в программу: справочник и свои черновики; в шаблон — только справочник. */
const visibleExercise = (owner: ProgramOwner): Prisma.ExerciseWhereInput =>
  owner === TEMPLATES
    ? { status: 'CATALOG' }
    : { OR: [{ status: 'CATALOG' }, { status: 'DRAFT', authorId: owner }] };

const NAME_MAX = 60;
const SETS_MAX = 20;

function cleanName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed) throw new BadRequestException('Название не может быть пустым.');
  if (trimmed.length > NAME_MAX)
    throw new BadRequestException(`Название — до ${NAME_MAX} символов.`);
  return trimmed;
}

@Injectable()
export class ProgramService {
  private readonly logger = new Logger(`📋 ${ProgramService.name}`);

  constructor(private readonly prisma: PrismaService) {}

  // ── Программы ───────────────────────────────────────────────────────────

  public async list(userId: number) {
    return this.prisma.program.findMany({
      where: { ownerId: userId },
      orderBy: { id: 'asc' },
      include: { _count: { select: { complexes: true } } },
    });
  }

  /** Опубликованные шаблоны в порядке каталога. */
  public async templates() {
    return this.prisma.program.findMany({
      where: PUBLISHED_TEMPLATE,
      orderBy: TEMPLATE_ORDER,
      include: {
        _count: { select: { complexes: true } },
        tags: { orderBy: PROGRAM_TAG_ORDER, select: PROGRAM_TAG_SELECT },
      },
    });
  }

  public async find(
    owner: ProgramOwner,
    programId: number,
  ): Promise<ProgramFull> {
    const program = await this.prisma.program.findFirst({
      where: { id: programId, ...ownerWhere(owner) },
      include: PROGRAM_INCLUDE,
    });
    if (!program) throw new NotFoundException('Программа не найдена.');
    return program;
  }

  public async create(userId: number, name: string, clientId?: string) {
    const program = await this.prisma.program.create({
      data: {
        name: cleanName(name),
        ownerId: userId,
        ...(clientId ? { clientId } : {}),
      },
    });
    this.logger.log(
      `Программа создана: programId=${program.id}, userId=${userId}`,
    );
    await this.activateIfNone(userId, program.id);
    return program;
  }

  public async rename(
    owner: ProgramOwner,
    programId: number,
    name: string,
    at?: Date,
  ) {
    const { count } = await this.prisma.program.updateMany({
      where: { id: programId, ...ownerWhere(owner) },
      data: { name: cleanName(name) },
    });
    if (!count) throw new NotFoundException('Программа не найдена.');
    await stampFields(this.prisma, 'program', programId, ['name'], at);
    this.logger.log(`Программа переименована: programId=${programId}`);
  }

  public async remove(owner: ProgramOwner, programId: number): Promise<void> {
    const { count } = await this.prisma.program.deleteMany({
      where: { id: programId, ...ownerWhere(owner) },
    });
    if (!count) throw new NotFoundException('Программа не найдена.');
    this.logger.log(
      `Программа удалена: programId=${programId}, владелец=${owner}`,
    );
  }

  /** Назначить активную программу: указатель ротации встаёт на её первый комплекс. */
  public async setActive(userId: number, programId: number): Promise<void> {
    const program = await this.find(userId, programId);
    await this.prisma.sportProfile.update({
      where: { userId },
      data: {
        activeProgramId: program.id,
        nextComplexId: program.complexes[0]?.id ?? null,
      },
    });
    this.logger.log(
      `Активная программа: programId=${programId}, userId=${userId}`,
    );
  }

  // ── Копирование ─────────────────────────────────────────────────────────

  /**
   * Копия шаблона или программы друга. Чужие черновики копируются как черновики получателя
   * с originDraftId на оригинал; записи справочника — по ссылке.
   */
  public async copy(sourceProgramId: number, ownerId: number) {
    const program = await this.prisma.$transaction(async (tx) => {
      const source = await tx.program.findUnique({
        where: { id: sourceProgramId },
        include: PROGRAM_INCLUDE,
      });
      if (!source) throw new NotFoundException('Программа не найдена.');
      const created = await tx.program.create({
        data: {
          // У опубликованной программы новое название может ждать проверки — берём одобренное
          name: source.publishedName ?? source.name,
          ownerId,
          sourceProgramId: source.id,
          sourceSyncedAt: source.contentUpdatedAt,
        },
      });
      await this.fill(tx, created.id, source, ownerId);
      return created;
    });
    this.logger.log(
      `Программа скопирована: sourceProgramId=${sourceProgramId} → programId=${program.id}, userId=${ownerId}`,
    );
    await this.activateIfNone(ownerId, program.id);
    return program;
  }

  /** «Взять» опубликованный шаблон: копия в программах пользователя. */
  public async takeTemplate(templateId: number, userId: number) {
    const template = await this.prisma.program.findFirst({
      where: { id: templateId, ...PUBLISHED_TEMPLATE },
      select: { id: true },
    });
    if (!template) {
      this.logger.warn(
        `Взять скрытый или несуществующий шаблон: templateId=${templateId}, userId=${userId}`,
      );
      throw new NotFoundException('Шаблон не найден.');
    }
    return this.copy(template.id, userId);
  }

  /** «Взять» из каталога Mini App: шаблон или чужая опубликованная программа пользователя. */
  public async takeFromCatalog(sourceId: number, userId: number) {
    const source = await this.prisma.program.findFirst({
      where: {
        id: sourceId,
        OR: [
          PUBLISHED_TEMPLATE,
          { ...PUBLISHED_USER_PROGRAM, ownerId: { not: userId } },
        ],
      },
      select: { id: true },
    });
    if (!source) {
      this.logger.warn(
        `Взять недоступную программу каталога: sourceId=${sourceId}, userId=${userId}`,
      );
      throw new NotFoundException('Программа не найдена в каталоге.');
    }
    return this.copy(source.id, userId);
  }

  /**
   * «Сделать шаблоном» свою программу (админ): скрытая копия-шаблон последней в каталоге,
   * оригинал остаётся у автора. Черновики в шаблон нельзя — его видят все, а черновик только автор.
   */
  public async copyToTemplate(userId: number, programId: number) {
    const source = await this.find(userId, programId);
    const drafts = source.complexes
      .flatMap((c) => c.exercises)
      .filter((item) => item.exercise.status === 'DRAFT');
    if (drafts.length) {
      this.logger.warn(
        `Шаблон из программы с черновиками: programId=${programId}, черновиков=${drafts.length}`,
      );
      throw new BadRequestException(
        'В программе есть черновики упражнений — дождись модерации или убери их.',
      );
    }
    const template = await this.prisma.$transaction(async (tx) => {
      const last = await tx.program.aggregate({
        where: { isTemplate: true },
        _max: { position: true },
      });
      const created = await tx.program.create({
        data: {
          name: source.name,
          isTemplate: true,
          position: (last._max.position ?? 0) + 1,
        },
      });
      await this.fill(tx, created.id, source, userId);
      return created;
    });
    this.logger.log(
      `Шаблон из программы: programId=${programId} → templateId=${template.id}, userId=${userId}`,
    );
    return template;
  }

  /**
   * «Обновить» копию версией автора: состав удаляется и копируется заново, id программы тот же.
   * История тренировок не трогается — она ссылается на упражнения, а не на комплексы.
   */
  public async resync(userId: number, programId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const copy = await tx.program.findFirst({
        where: {
          id: programId,
          ownerId: userId,
          sourceProgramId: { not: null },
        },
        include: { sourceProgram: { include: PROGRAM_INCLUDE } },
      });
      if (!copy?.sourceProgram)
        throw new NotFoundException('Программа-источник больше недоступна.');
      await tx.complex.deleteMany({ where: { programId } });
      await this.fill(tx, programId, copy.sourceProgram, userId);
      await tx.program.update({
        where: { id: programId },
        data: {
          name: copy.sourceProgram.publishedName ?? copy.sourceProgram.name,
          sourceSyncedAt: copy.sourceProgram.contentUpdatedAt,
          sourceDismissedAt: null,
          contentUpdatedAt: new Date(),
        },
      });
    });
    this.logger.log(
      `Копия обновлена: programId=${programId}, userId=${userId}`,
    );
    await this.repairPointer(userId, true);
  }

  // ── Поделиться ──────────────────────────────────────────────────────────

  /**
   * Токен ссылки «Поделиться» на свою программу. Ставится при первом шаринге и потом не меняется —
   * уже разосланные ссылки продолжают работать.
   */
  public async shareToken(
    userId: number,
    programId: number,
  ): Promise<{ name: string; shareToken: string }> {
    const where = {
      id: programId,
      ownerId: userId,
      isTemplate: false,
    } satisfies Prisma.ProgramWhereInput;
    const select = { name: true, shareToken: true } as const;
    try {
      const program = await this.prisma.program.update({
        where: { ...where, AND: { shareToken: null } },
        data: { shareToken: randomBytes(8).toString('hex') },
        select,
      });
      this.logger.log(
        `Токен программы выдан: programId=${programId}, userId=${userId}`,
      );
      return program as { name: string; shareToken: string };
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2025'
      )
        throw error;
    }
    // Токен уже был — или программы нет
    const program = await this.prisma.program.findFirst({
      where: { ...where, shareToken: { not: null } },
      select,
    });
    if (!program) throw new NotFoundException('Программа не найдена.');
    return program as { name: string; shareToken: string };
  }

  /** «Забрать себе» по ссылке: копия чужой программы, дружба не нужна — хватает токена. */
  public async takeShared(shareToken: string, userId: number) {
    const source = await this.prisma.program.findUnique({
      where: { shareToken },
      select: { id: true },
    });
    if (!source)
      throw new NotFoundException('Ссылка устарела: программу удалили.');
    this.logger.log(
      `Программа по ссылке: programId=${source.id}, userId=${userId}`,
    );
    return this.copy(source.id, userId);
  }

  // ── Комплексы ───────────────────────────────────────────────────────────

  public async findComplex(
    owner: ProgramOwner,
    complexId: number,
  ): Promise<ComplexFull> {
    const complex = await this.prisma.complex.findFirst({
      where: { id: complexId, program: ownerWhere(owner) },
      include: COMPLEX_INCLUDE,
    });
    if (!complex) throw new NotFoundException('Тренировка не найдена.');
    return complex;
  }

  public async addComplex(
    owner: ProgramOwner,
    programId: number,
    name: string,
    /** clientId комплекса с телефона: после синка у телефона та же строка */
    clientId?: string,
  ) {
    const program = await this.find(owner, programId);
    const complex = await this.prisma.complex.create({
      data: {
        programId,
        ...(clientId ? { clientId } : {}),
        name: cleanName(name),
        position: (program.complexes.at(-1)?.position ?? 0) + 1,
      },
    });
    await this.touch(programId);
    if (owner !== TEMPLATES) await this.repairPointer(owner);
    this.logger.log(
      `Комплекс создан: complexId=${complex.id}, programId=${programId}`,
    );
    return complex;
  }

  /**
   * Копия одной тренировки в конец активной программы пользователя. Источник — то, что пользователь
   * и так видит: каталог, свои программы, программы друзей или программа по ссылке (нужен её токен).
   * Возвращает id активной программы.
   */
  public async copyComplex(
    userId: number,
    complexId: number,
    shareToken?: string,
    targetProgramId?: number,
  ): Promise<number> {
    const visible: Prisma.ProgramWhereInput[] = [
      PUBLISHED_TEMPLATE,
      PUBLISHED_USER_PROGRAM,
      { ownerId: userId },
      // Друзья: то же условие, что friendOf в social.service (импорт оттуда дал бы цикл модулей)
      {
        isTemplate: false,
        owner: {
          OR: [
            { friendshipsA: { some: { userBId: userId } } },
            { friendshipsB: { some: { userAId: userId } } },
          ],
        },
      },
    ];
    if (shareToken) visible.push({ shareToken });
    const source = await this.prisma.complex.findFirst({
      where: { id: complexId, program: { OR: visible } },
      include: PROGRAM_INCLUDE.complexes.include,
    });
    if (!source) {
      this.logger.warn(
        `Копия недоступной тренировки: complexId=${complexId}, userId=${userId}`,
      );
      throw new NotFoundException('Тренировка не найдена.');
    }
    const programId = targetProgramId ?? (await this.activeProgramId(userId));
    if (!programId)
      throw new BadRequestException(
        'Нет активной программы — сначала выбери или создай программу.',
      );
    // Целевая программа — только своя
    await this.find(userId, programId);
    const created = await this.prisma.$transaction(async (tx) => {
      const last = await tx.complex.aggregate({
        where: { programId },
        _max: { position: true },
      });
      return this.copyComplexInto(
        tx,
        programId,
        source,
        (last._max.position ?? 0) + 1,
        userId,
      );
    });
    await this.touch(programId);
    await this.repairPointer(userId);
    this.logger.log(
      `Тренировка скопирована: complexId=${complexId} → complexId=${created.id}, programId=${programId}, userId=${userId}`,
    );
    return programId;
  }

  private async activeProgramId(userId: number): Promise<number | null> {
    const profile = await this.prisma.sportProfile.findUnique({
      where: { userId },
      select: { activeProgramId: true },
    });
    return profile?.activeProgramId ?? null;
  }

  public async renameComplex(
    owner: ProgramOwner,
    complexId: number,
    name: string,
    at?: Date,
  ) {
    const { count } = await this.prisma.complex.updateMany({
      where: { id: complexId, program: ownerWhere(owner) },
      data: { name: cleanName(name) },
    });
    if (!count) throw new NotFoundException('Тренировка не найдена.');
    await stampFields(this.prisma, 'complex', complexId, ['name'], at);
  }

  /** Разминка комплекса: null — как в профиле, 0 — без разминки. */
  public async setComplexWarmup(
    owner: ProgramOwner,
    complexId: number,
    warmupMinutes: number | null,
    at?: Date,
  ): Promise<void> {
    const { count } = await this.prisma.complex.updateMany({
      where: { id: complexId, program: ownerWhere(owner) },
      data: { warmupMinutes },
    });
    if (!count) throw new NotFoundException('Тренировка не найдена.');
    await stampFields(this.prisma, 'complex', complexId, ['warmupMinutes'], at);
    this.logger.log(
      `Разминка комплекса: complexId=${complexId}, минут=${warmupMinutes ?? 'как в профиле'}`,
    );
  }

  /** Убрать старый кардио-блок: кардио теперь — упражнения на время в самом комплексе. */
  public async clearCardio(userId: number, complexId: number): Promise<void> {
    await this.updateCardio(userId, complexId, null, null);
  }

  /** @returns id программы, из которой удалён комплекс. */
  public async removeComplex(
    owner: ProgramOwner,
    complexId: number,
  ): Promise<number> {
    const complex = await this.findComplex(owner, complexId);
    await this.prisma.complex.delete({ where: { id: complexId } });
    await this.touch(complex.programId);
    // Указатель ротации на удалённом комплексе обнулился (SetNull) — ставим на первый
    if (owner !== TEMPLATES) await this.repairPointer(owner);
    this.logger.log(
      `Комплекс удалён: complexId=${complexId}, владелец=${owner}`,
    );
    return complex.programId;
  }

  public async moveComplex(
    userId: number,
    complexId: number,
    direction: -1 | 1,
  ): Promise<number> {
    const complex = await this.findComplex(userId, complexId);
    const siblings = await this.prisma.complex.findMany({
      where: { programId: complex.programId },
      orderBy: { position: 'asc' },
    });
    await this.swap(siblings, complexId, direction, (id, position) =>
      this.prisma.complex.update({ where: { id }, data: { position } }),
    );
    await this.touch(complex.programId);
    return complex.programId;
  }

  // ── Упражнения комплекса ────────────────────────────────────────────────

  public async addExercise(
    owner: ProgramOwner,
    complexId: number,
    exerciseId: number,
  ) {
    // Дубли разрешены: одно упражнение может стоять в комплексе дважды, например в двух суперсетах
    const complex = await this.findComplex(owner, complexId);
    const visible = await this.prisma.exercise.findFirst({
      where: { id: exerciseId, ...visibleExercise(owner) },
      select: { id: true, measure: true },
    });
    if (!visible) throw new NotFoundException('Упражнение не найдено.');
    await this.prisma.complexExercise.create({
      data: {
        complexId,
        exerciseId,
        position: (complex.exercises.at(-1)?.position ?? 0) + 1,
        ...defaultPlan(visible.measure),
      },
    });
    await this.touch(complex.programId);
    this.logger.log(
      `Упражнение добавлено в комплекс: complexId=${complexId}, exerciseId=${exerciseId}`,
    );
  }

  /**
   * Подбор из справочника: несколько упражнений сразу. Уже стоящие в комплексе добавляются ещё раз —
   * одно упражнение бывает нужно в двух суперсетах.
   * joinItemId — встать в суперсет этого упражнения сразу за его участниками,
   * newSuperset — собрать выбранные в новый суперсет в конце комплекса.
   * @returns id программы.
   */
  public async addExercises(
    owner: ProgramOwner,
    complexId: number,
    exerciseIds: number[],
    target: { joinItemId?: number; newSuperset?: boolean } = {},
    /** clientId новых строк с телефона — по порядку exerciseIds без повторов */
    clientIds?: string[],
  ): Promise<number> {
    const complex = await this.findComplex(owner, complexId);
    const fresh = [...new Set(exerciseIds)];
    if (target.newSuperset && fresh.length < 2)
      throw new BadRequestException(
        'Для суперсета выбери хотя бы два упражнения.',
      );
    const visible = await this.prisma.exercise.findMany({
      where: { id: { in: fresh }, ...visibleExercise(owner) },
      select: { id: true, measure: true },
    });
    if (visible.length !== fresh.length)
      throw new NotFoundException('Упражнение не найдено.');
    const measureOf = new Map(visible.map((e) => [e.id, e.measure]));

    const order: SupersetSlot[] = complex.exercises.map((e) => ({
      id: e.id,
      superset: e.superset,
    }));
    // Номер больше всех: applyOrder всё равно перенумерует суперсеты сверху вниз
    const newNo = Math.max(0, ...order.map((e) => e.superset ?? 0)) + 1;
    let insertAt = order.length;
    let superset: number | null = target.newSuperset ? newNo : null;
    if (target.joinItemId !== undefined) {
      const anchorIndex = order.findIndex((e) => e.id === target.joinItemId);
      if (anchorIndex < 0)
        throw new NotFoundException('Упражнение тренировки не найдено.');
      const anchor = order[anchorIndex];
      anchor.superset ??= newNo;
      superset = anchor.superset;
      insertAt = anchorIndex + 1;
      while (order[insertAt]?.superset === superset) insertAt++;
    }

    await this.prisma.$transaction(async (tx) => {
      const created: SupersetSlot[] = [];
      for (const [index, exerciseId] of fresh.entries()) {
        const item = await tx.complexExercise.create({
          data: {
            complexId,
            exerciseId,
            ...(clientIds?.[index] ? { clientId: clientIds[index] } : {}),
            position: 0,
            ...defaultPlan(measureOf.get(exerciseId)!),
          },
          select: { id: true },
        });
        created.push({ id: item.id, superset });
      }
      order.splice(insertAt, 0, ...created);
      await this.applyOrder(tx, complex.exercises, order);
    });
    await this.touch(complex.programId);
    this.logger.log(
      `Упражнения добавлены в комплекс: complexId=${complexId}, exerciseIds=[${fresh.join(',')}], суперсет=${superset ?? 'нет'}`,
    );
    return complex.programId;
  }

  /** Вынести упражнение из суперсета: встаёт сразу за блоком. @returns id программы. */
  public async ungroupItem(
    owner: ProgramOwner,
    itemId: number,
  ): Promise<number> {
    const item = await this.findItem(owner, itemId);
    if (item.superset === null)
      throw new BadRequestException('Упражнение не в суперсете.');
    const siblings = await this.prisma.complexExercise.findMany({
      where: { complexId: item.complexId },
      orderBy: { position: 'asc' },
    });
    const order: SupersetSlot[] = siblings
      .filter((e) => e.id !== itemId)
      .map((e) => ({ id: e.id, superset: e.superset }));
    const lastMember = order.findLastIndex((e) => e.superset === item.superset);
    order.splice(lastMember + 1, 0, { id: itemId, superset: null });
    await this.prisma.$transaction((tx) =>
      this.applyOrder(tx, siblings, order),
    );
    await this.touch(item.complex.programId);
    this.logger.log(
      `Упражнение вынесено из суперсета: itemId=${itemId}, complexId=${item.complexId}, суперсет=${item.superset}`,
    );
    return item.complex.programId;
  }

  /** Разгруппировать суперсет целиком: упражнения остаются на своих местах. @returns id программы. */
  public async ungroupSuperset(
    owner: ProgramOwner,
    complexId: number,
    superset: number,
  ): Promise<number> {
    const complex = await this.findComplex(owner, complexId);
    if (!complex.exercises.some((e) => e.superset === superset))
      throw new NotFoundException('Суперсет не найден.');
    await this.prisma.$transaction((tx) =>
      this.applyOrder(
        tx,
        complex.exercises,
        complex.exercises.map((e) => ({
          id: e.id,
          superset: e.superset === superset ? null : e.superset,
        })),
      ),
    );
    await this.touch(complex.programId);
    this.logger.log(
      `Суперсет разгруппирован: complexId=${complexId}, суперсет=${superset}`,
    );
    return complex.programId;
  }

  public async findItem(owner: ProgramOwner, itemId: number) {
    const item = await this.prisma.complexExercise.findFirst({
      where: { id: itemId, complex: { program: ownerWhere(owner) } },
      include: { exercise: true, complex: true },
    });
    if (!item) throw new NotFoundException('Упражнение тренировки не найдено.');
    return item;
  }

  /** @returns id комплекса. */
  public async removeItem(
    owner: ProgramOwner,
    itemId: number,
  ): Promise<number> {
    const item = await this.findItem(owner, itemId);
    await this.prisma.$transaction(async (tx) => {
      await tx.complexExercise.delete({ where: { id: itemId } });
      // Из суперсета на двоих остаётся одиночное упражнение
      if (item.superset !== null) await this.normalize(tx, item.complexId);
    });
    await this.touch(item.complex.programId);
    this.logger.log(`Упражнение убрано из комплекса: itemId=${itemId}`);
    return item.complexId;
  }

  public async moveItem(
    userId: number,
    itemId: number,
    direction: -1 | 1,
  ): Promise<number> {
    const item = await this.findItem(userId, itemId);
    const siblings = await this.prisma.complexExercise.findMany({
      where: { complexId: item.complexId },
      orderBy: { position: 'asc' },
    });
    await this.swap(siblings, itemId, direction, (id, position) =>
      this.prisma.complexExercise.update({ where: { id }, data: { position } }),
    );
    // В боте суперсеты не собирают: шаг за границу блока выводит упражнение из группы
    await this.prisma.$transaction((tx) => this.normalize(tx, item.complexId));
    await this.touch(item.complex.programId);
    return item.complexId;
  }

  /**
   * План из ввода: «4 8 12», «4x8-12», «3 10». У удержания вторая и третья величины —
   * секунды: «3 30 60»; у кардио — одно число минут: «1 20».
   */
  public async setPlan(userId: number, itemId: number, input: string) {
    const item = await this.findItem(userId, itemId);
    const { measure } = item.exercise;
    const parts = input
      .trim()
      .split(/[\s×xх*–-]+/i)
      .filter(Boolean);
    const sets = Number(parts[0]);
    const values = parts
      .slice(1)
      .map((part) =>
        isTimed(measure) ? parseTime(measure, part) : Number(part),
      );
    if (
      parts.length < 2 ||
      // У кардио одно число минут, диапазона нет
      parts.length > (measure === 'MINUTES' ? 2 : 3) ||
      !/^\d+$/.test(parts[0]) ||
      values.some((v) => v === null || !Number.isInteger(v))
    )
      throw new BadRequestException(
        measure === 'MINUTES'
          ? 'Не понял. Формат: подходы и минуты, например «1 20».'
          : measure === 'TIME'
            ? 'Не понял. Формат: подходы и время, например «3 30 60» (секунды) или «1 1:30».'
            : 'Не понял. Формат: подходы и повторы, например «4 8 12» или «3 10».',
      );
    const [repsMin, repsMax = repsMin] = values as number[];
    this.checkPlan(measure, { sets, repsMin, repsMax });
    await this.prisma.complexExercise.update({
      where: { id: itemId },
      data: { sets, repsMin, repsMax },
    });
    await this.touch(item.complex.programId);
    return item;
  }

  /**
   * Замена «в комплексе»: план подходов и повторов остаётся прежним.
   * Меняется одна строка, а не все одинаковые: упражнение может стоять в комплексе дважды.
   * superset — снимок из тренировки, по нему выбираем нужный дубль; не совпал — берём первый по порядку.
   */
  public async replaceExercise(
    userId: number,
    complexId: number,
    fromExerciseId: number,
    toExerciseId: number,
    superset: number | null,
  ): Promise<void> {
    const candidates = await this.prisma.complexExercise.findMany({
      where: {
        complexId,
        exerciseId: fromExerciseId,
        complex: { program: { ownerId: userId } },
      },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        superset: true,
        complex: { select: { programId: true } },
      },
    });
    const target =
      candidates.find((c) => c.superset === superset) ?? candidates[0];
    if (!target) {
      this.logger.warn(
        `Замена в комплексе: строки нет, complexId=${complexId}, exerciseId=${fromExerciseId}`,
      );
      return;
    }
    await this.prisma.complexExercise.update({
      where: { id: target.id },
      data: { exerciseId: toExerciseId },
    });
    await this.touch(target.complex.programId);
    this.logger.log(
      `Замена в комплексе: complexId=${complexId}, itemId=${target.id}, ${fromExerciseId} → ${toExerciseId}`,
    );
  }

  // ── Редактор приложения ─────────────────────────────────────────────────

  /** План подходов из формы: «3 × 8–12»; у упражнения на время — секунды. */
  public async updatePlan(
    owner: ProgramOwner,
    itemId: number,
    plan: { sets: number; repsMin: number; repsMax: number },
    at?: Date,
  ) {
    const item = await this.findItem(owner, itemId);
    this.checkPlan(item.exercise.measure, plan);
    await this.prisma.complexExercise.update({
      where: { id: itemId },
      data: plan,
    });
    // План — одно значение «подходы × повторы»: отметка общая, половину чужой правки не смешиваем
    await stampFields(this.prisma, 'complexItem', itemId, ['plan'], at);
    await this.touch(item.complex.programId);
    this.logger.log(
      `План упражнения: itemId=${itemId}, ${plan.sets}×${plan.repsMin}-${plan.repsMax}`,
    );
    return item;
  }

  /** Порядок комплексов после перетаскивания: ids — все комплексы программы в новом порядке. */
  public async reorderComplexes(
    owner: ProgramOwner,
    programId: number,
    ids: number[],
  ): Promise<void> {
    const program = await this.find(owner, programId);
    this.assertSameSet(
      program.complexes.map((c) => c.id),
      ids,
    );
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.complex.update({
          where: { id },
          data: { position: index + 1 },
        }),
      ),
    );
    await this.touch(programId);
    this.logger.log(
      `Порядок комплексов: programId=${programId}, [${ids.join(',')}]`,
    );
  }

  /** Порядок упражнений комплекса: ids — все упражнения комплекса в новом порядке. */
  public async reorderItems(
    owner: ProgramOwner,
    complexId: number,
    ids: number[],
  ): Promise<number> {
    const complex = await this.findComplex(owner, complexId);
    this.assertSameSet(
      complex.exercises.map((e) => e.id),
      ids,
    );
    const supersets = new Map(complex.exercises.map((e) => [e.id, e.superset]));
    await this.prisma.$transaction((tx) =>
      this.applyOrder(
        tx,
        complex.exercises,
        ids.map((id) => ({ id, superset: supersets.get(id) ?? null })),
      ),
    );
    await this.touch(complex.programId);
    this.logger.log(
      `Порядок упражнений: complexId=${complexId}, [${ids.join(',')}]`,
    );
    return complex.programId;
  }

  // ── Ротация ─────────────────────────────────────────────────────────────

  /** Комплексы активной программы по порядку. */
  public async activeComplexes(userId: number) {
    return this.prisma.complex.findMany({
      where: { program: { activeFor: { some: { userId } } } },
      orderBy: { position: 'asc' },
      include: { _count: { select: { exercises: true } } },
    });
  }

  /** Комплекс, который бот предложит следующим; null — нет активной программы или она пуста. */
  public async nextComplex(userId: number) {
    const nextComplexId = await this.repairPointer(userId);
    if (!nextComplexId) return null;
    return this.prisma.complex.findUnique({
      where: { id: nextComplexId },
      include: COMPLEX_INCLUDE,
    });
  }

  /**
   * Ручной выбор следующего комплекса в очереди. Принадлежность активной программе — в where той же
   * мутации: чужой или неактивный комплекс даёт P2025. Возвращает id активной программы.
   */
  public async setNext(userId: number, complexId: number): Promise<number> {
    try {
      const profile = await this.prisma.sportProfile.update({
        where: {
          userId,
          activeProgram: { complexes: { some: { id: complexId } } },
        },
        data: { nextComplexId: complexId },
        select: { activeProgramId: true, timeZone: true },
      });
      // Утром крон закрепляет за днём комплекс, и он перекрыл бы новый выбор на «Сегодня».
      // Ручной выбор свежее — переносим его на ещё не отмеченный сегодняшний день
      const { count } = await this.prisma.planDay.updateMany({
        where: {
          userId,
          date: localToday(profile.timeZone),
          status: 'PENDING',
        },
        data: { suggestedComplexId: complexId },
      });
      this.logger.log(
        `Следующий комплекс выбран вручную: userId=${userId}, nextComplexId=${complexId}, деньСегодня=${count ? 'обновлён' : 'нет'}`,
      );
      return profile.activeProgramId!;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(
          'Тренировка не найдена в активной программе.',
        );
      }
      throw e;
    }
  }

  /**
   * Сдвиг ротации после засчитанной тренировки: следующий по position после выполненного,
   * после последнего — первый. Считается от выполненного, а не от указателя.
   */
  public async advance(
    tx: Tx,
    userId: number,
    doneComplexId: number | null,
  ): Promise<void> {
    const profile = await tx.sportProfile.findUnique({
      where: { userId },
      select: { activeProgramId: true },
    });
    if (!profile?.activeProgramId) return;
    const complexes = await tx.complex.findMany({
      where: { programId: profile.activeProgramId },
      orderBy: { position: 'asc' },
      select: { id: true },
    });
    const index = complexes.findIndex((c) => c.id === doneComplexId);
    // Выполнен комплекс не из активной программы — указатель не трогаем
    if (index < 0) return;
    const next = complexes[(index + 1) % complexes.length];
    await tx.sportProfile.update({
      where: { userId },
      data: { nextComplexId: next.id },
    });
    this.logger.log(
      `Ротация сдвинута: userId=${userId}, nextComplexId=${next.id}`,
    );
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /** Границы плана по мере: повторы до 200, время до 4 часов. */
  private checkPlan(
    measure: ExerciseMeasure,
    plan: { sets: number; repsMin: number; repsMax: number },
  ): void {
    const max = MEASURE_LIMITS[measure].plan;
    if (
      plan.sets < 1 ||
      plan.sets > SETS_MAX ||
      plan.repsMin < 1 ||
      plan.repsMax > max ||
      plan.repsMin > plan.repsMax
    )
      throw new BadRequestException(
        isTimed(measure)
          ? `Подходов — от 1 до ${SETS_MAX}, время — от 1 секунды до 4 часов, минимум не больше максимума.`
          : `Подходов — от 1 до ${SETS_MAX}, повторов — от 1 до ${max}, минимум не больше максимума.`,
      );
  }

  /** Любая правка состава программы — по этой отметке друг узнаёт об обновлении. */
  private async touch(programId: number): Promise<void> {
    await this.prisma.program.update({
      where: { id: programId },
      data: { contentUpdatedAt: new Date() },
    });
  }

  private async updateCardio(
    owner: ProgramOwner,
    complexId: number,
    cardioName: string | null,
    cardioMinutes: number | null,
  ): Promise<void> {
    const [complex] = await this.prisma.complex.updateManyAndReturn({
      where: { id: complexId, program: ownerWhere(owner) },
      data: { cardioName, cardioMinutes },
      select: { programId: true },
    });
    if (!complex) throw new NotFoundException('Тренировка не найдена.');
    await this.touch(complex.programId);
    this.logger.log(
      `Кардио комплекса: complexId=${complexId}, минут=${cardioMinutes ?? 'нет'}`,
    );
  }

  private async activateIfNone(
    userId: number,
    programId: number,
  ): Promise<void> {
    const { count } = await this.prisma.sportProfile.updateMany({
      where: { userId, activeProgramId: null },
      data: { activeProgramId: programId },
    });
    if (count) await this.repairPointer(userId, true);
  }

  /**
   * Указатель ротации должен смотреть на комплекс активной программы: комплекс удалён или
   * программа сменилась — встаёт на первый. reset — поставить на первый принудительно.
   */
  private async repairPointer(
    userId: number,
    reset = false,
  ): Promise<number | null> {
    const profile = await this.prisma.sportProfile.findUnique({
      where: { userId },
      select: {
        nextComplexId: true,
        activeProgram: {
          select: {
            complexes: { orderBy: { position: 'asc' }, select: { id: true } },
          },
        },
      },
    });
    const ids = profile?.activeProgram?.complexes.map((c) => c.id) ?? [];
    const current = profile?.nextComplexId ?? null;
    const valid = !reset && current !== null && ids.includes(current);
    const next = valid ? current : (ids[0] ?? null);
    if (next !== current) {
      await this.prisma.sportProfile.update({
        where: { userId },
        data: { nextComplexId: next },
      });
      this.logger.log(
        `Указатель ротации: userId=${userId}, nextComplexId=${next}`,
      );
    }
    return next;
  }

  private async fill(
    tx: Tx,
    programId: number,
    source: ProgramFull,
    ownerId: number,
  ): Promise<void> {
    /** Черновик автора → черновик получателя: одна копия на оригинал, даже в нескольких комплексах. */
    const draftCopies = new Map<number, number>();
    for (const complex of source.complexes)
      await this.copyComplexInto(
        tx,
        programId,
        complex,
        complex.position,
        ownerId,
        draftCopies,
      );
  }

  /** Копия одного комплекса со всеми упражнениями в программу programId на позицию position. */
  private async copyComplexInto(
    tx: Tx,
    programId: number,
    complex: ProgramFull['complexes'][number],
    position: number,
    ownerId: number,
    draftCopies = new Map<number, number>(),
  ) {
    const created = await tx.complex.create({
      data: {
        programId,
        name: complex.name,
        position,
        cardioName: complex.cardioName,
        cardioMinutes: complex.cardioMinutes,
        warmupMinutes: complex.warmupMinutes,
      },
    });
    for (const item of complex.exercises) {
      let exerciseId = item.exerciseId;
      if (
        item.exercise.status === 'DRAFT' &&
        item.exercise.authorId !== ownerId
      ) {
        exerciseId =
          draftCopies.get(item.exerciseId) ??
          (await this.copyDraft(tx, item.exerciseId, ownerId));
        draftCopies.set(item.exerciseId, exerciseId);
      }
      await tx.complexExercise.create({
        data: {
          complexId: created.id,
          exerciseId,
          position: item.position,
          sets: item.sets,
          repsMin: item.repsMin,
          repsMax: item.repsMax,
          superset: item.superset,
        },
      });
    }
    return created;
  }

  /** Тот же порядок упражнений комплекса, только с починкой суперсетов. */
  private async normalize(tx: Tx, complexId: number): Promise<void> {
    const items = await tx.complexExercise.findMany({
      where: { complexId },
      orderBy: { position: 'asc' },
    });
    await this.applyOrder(tx, items, items);
  }

  /** Пишет позиции 1..n и исправленные суперсеты; строки без изменений не трогает. */
  private async applyOrder(
    tx: Tx,
    current: { id: number; position: number; superset: number | null }[],
    order: SupersetSlot[],
  ): Promise<void> {
    const before = new Map(current.map((e) => [e.id, e]));
    for (const [index, item] of normalizeSupersets(order).entries()) {
      const position = index + 1;
      const old = before.get(item.id);
      if (old?.position === position && old.superset === item.superset)
        continue;
      await tx.complexExercise.update({
        where: { id: item.id },
        data: { position, superset: item.superset },
      });
    }
  }

  private async copyDraft(
    tx: Tx,
    draftId: number,
    ownerId: number,
  ): Promise<number> {
    const draft = await tx.exercise.findUniqueOrThrow({
      where: { id: draftId },
      include: { muscles: true, joints: true },
    });
    // Копия копии ссылается на самый первый оригинал: исход модерации применяется ко всем
    const originDraftId = draft.originDraftId ?? draft.id;
    const existing = await tx.exercise.findFirst({
      where: { authorId: ownerId, originDraftId, status: 'DRAFT' },
      select: { id: true },
    });
    if (existing) return existing.id;
    const copy = await tx.exercise.create({
      data: {
        name: draft.name,
        nameNormalized: draft.nameNormalized,
        technique: draft.technique,
        steps: draft.steps,
        mistakes: draft.mistakes,
        videoUrl: draft.videoUrl,
        equipment: draft.equipment,
        measure: draft.measure,
        imagePath: draft.imagePath,
        status: 'DRAFT',
        authorId: ownerId,
        originDraftId,
        muscles: {
          create: draft.muscles.map((m) => ({
            muscleId: m.muscleId,
            role: m.role,
          })),
        },
        joints: { create: draft.joints.map((j) => ({ jointId: j.jointId })) },
      },
    });
    return copy.id;
  }

  /** Новый порядок — та же самая выборка id, без пропусков и чужих. */
  private assertSameSet(current: number[], next: number[]): void {
    const same =
      current.length === next.length &&
      new Set(next).size === next.length &&
      next.every((id) => current.includes(id));
    if (!same)
      throw new BadRequestException(
        'Список изменился — обнови экран и попробуй ещё раз.',
      );
  }

  private async swap<T extends { id: number; position: number }>(
    siblings: T[],
    id: number,
    direction: -1 | 1,
    update: (id: number, position: number) => Promise<unknown>,
  ): Promise<void> {
    const index = siblings.findIndex((s) => s.id === id);
    const other = siblings[index + direction];
    if (index < 0 || !other) return;
    const current = siblings[index];
    // Позиции могли совпасть после удалений — разводим явно
    const [a, b] =
      current.position === other.position
        ? [current.position + direction, current.position]
        : [other.position, current.position];
    await update(current.id, a);
    await update(other.id, b);
  }
}
