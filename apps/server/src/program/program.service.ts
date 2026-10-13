import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { Prisma } from '@/generated/prisma/client';

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

const NAME_MAX = 60;
const DEFAULT_PLAN = { sets: 3, repsMin: 8, repsMax: 12 };

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

  public async templates() {
    return this.prisma.program.findMany({
      where: { isTemplate: true },
      orderBy: { id: 'asc' },
      include: { _count: { select: { complexes: true } } },
    });
  }

  public async find(userId: number, programId: number): Promise<ProgramFull> {
    const program = await this.prisma.program.findFirst({
      where: { id: programId, ownerId: userId },
      include: PROGRAM_INCLUDE,
    });
    if (!program) throw new NotFoundException('Программа не найдена.');
    return program;
  }

  public async create(userId: number, name: string) {
    const program = await this.prisma.program.create({
      data: { name: cleanName(name), ownerId: userId },
    });
    this.logger.log(
      `Программа создана: programId=${program.id}, userId=${userId}`,
    );
    await this.activateIfNone(userId, program.id);
    return program;
  }

  public async rename(userId: number, programId: number, name: string) {
    const { count } = await this.prisma.program.updateMany({
      where: { id: programId, ownerId: userId },
      data: { name: cleanName(name) },
    });
    if (!count) throw new NotFoundException('Программа не найдена.');
    this.logger.log(`Программа переименована: programId=${programId}`);
  }

  public async remove(userId: number, programId: number): Promise<void> {
    const { count } = await this.prisma.program.deleteMany({
      where: { id: programId, ownerId: userId },
    });
    if (!count) throw new NotFoundException('Программа не найдена.');
    this.logger.log(
      `Программа удалена: programId=${programId}, userId=${userId}`,
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
          name: source.name,
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
          name: copy.sourceProgram.name,
          sourceSyncedAt: copy.sourceProgram.contentUpdatedAt,
          contentUpdatedAt: new Date(),
        },
      });
    });
    this.logger.log(
      `Копия обновлена: programId=${programId}, userId=${userId}`,
    );
    await this.repairPointer(userId, true);
  }

  // ── Комплексы ───────────────────────────────────────────────────────────

  public async findComplex(
    userId: number,
    complexId: number,
  ): Promise<ComplexFull> {
    const complex = await this.prisma.complex.findFirst({
      where: { id: complexId, program: { ownerId: userId } },
      include: COMPLEX_INCLUDE,
    });
    if (!complex) throw new NotFoundException('Комплекс не найден.');
    return complex;
  }

  public async addComplex(userId: number, programId: number, name: string) {
    const program = await this.find(userId, programId);
    const complex = await this.prisma.complex.create({
      data: {
        programId,
        name: cleanName(name),
        position: (program.complexes.at(-1)?.position ?? 0) + 1,
      },
    });
    await this.touch(programId);
    await this.repairPointer(userId);
    this.logger.log(
      `Комплекс создан: complexId=${complex.id}, programId=${programId}`,
    );
    return complex;
  }

  public async renameComplex(userId: number, complexId: number, name: string) {
    const { count } = await this.prisma.complex.updateMany({
      where: { id: complexId, program: { ownerId: userId } },
      data: { name: cleanName(name) },
    });
    if (!count) throw new NotFoundException('Комплекс не найден.');
  }

  /** @returns id программы, из которой удалён комплекс. */
  public async removeComplex(
    userId: number,
    complexId: number,
  ): Promise<number> {
    const complex = await this.findComplex(userId, complexId);
    await this.prisma.complex.delete({ where: { id: complexId } });
    await this.touch(complex.programId);
    // Указатель ротации на удалённом комплексе обнулился (SetNull) — ставим на первый
    await this.repairPointer(userId);
    this.logger.log(
      `Комплекс удалён: complexId=${complexId}, userId=${userId}`,
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
    userId: number,
    complexId: number,
    exerciseId: number,
  ) {
    const complex = await this.findComplex(userId, complexId);
    if (complex.exercises.some((item) => item.exerciseId === exerciseId))
      throw new BadRequestException('Это упражнение уже есть в комплексе.');
    const visible = await this.prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        OR: [{ status: 'CATALOG' }, { status: 'DRAFT', authorId: userId }],
      },
      select: { id: true },
    });
    if (!visible) throw new NotFoundException('Упражнение не найдено.');
    await this.prisma.complexExercise.create({
      data: {
        complexId,
        exerciseId,
        position: (complex.exercises.at(-1)?.position ?? 0) + 1,
        ...DEFAULT_PLAN,
      },
    });
    await this.touch(complex.programId);
    this.logger.log(
      `Упражнение добавлено в комплекс: complexId=${complexId}, exerciseId=${exerciseId}`,
    );
  }

  public async findItem(userId: number, itemId: number) {
    const item = await this.prisma.complexExercise.findFirst({
      where: { id: itemId, complex: { program: { ownerId: userId } } },
      include: { exercise: true, complex: true },
    });
    if (!item) throw new NotFoundException('Упражнение комплекса не найдено.');
    return item;
  }

  /** @returns id комплекса. */
  public async removeItem(userId: number, itemId: number): Promise<number> {
    const item = await this.findItem(userId, itemId);
    await this.prisma.complexExercise.delete({ where: { id: itemId } });
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
    await this.touch(item.complex.programId);
    return item.complexId;
  }

  /** План из ввода: «4 8 12», «4x8-12», «3 10». */
  public async setPlan(userId: number, itemId: number, input: string) {
    const numbers = (input.match(/\d+/g) ?? []).map(Number);
    if (numbers.length < 2 || numbers.length > 3)
      throw new BadRequestException(
        'Не понял. Формат: подходы и повторы, например «4 8 12» или «3 10».',
      );
    const [sets, repsMin, repsMax = repsMin] = numbers;
    if (
      sets < 1 ||
      sets > 20 ||
      repsMin < 1 ||
      repsMax > 200 ||
      repsMin > repsMax
    )
      throw new BadRequestException(
        'Подходов — от 1 до 20, повторов — от 1 до 200, минимум не больше максимума.',
      );
    const item = await this.findItem(userId, itemId);
    await this.prisma.complexExercise.update({
      where: { id: itemId },
      data: { sets, repsMin, repsMax },
    });
    await this.touch(item.complex.programId);
    return item;
  }

  /** Замена «в комплексе»: план подходов и повторов остаётся прежним. */
  public async replaceExercise(
    userId: number,
    complexId: number,
    fromExerciseId: number,
    toExerciseId: number,
  ): Promise<void> {
    const { count } = await this.prisma.complexExercise.updateMany({
      where: {
        complexId,
        exerciseId: fromExerciseId,
        complex: { program: { ownerId: userId } },
      },
      data: { exerciseId: toExerciseId },
    });
    if (!count) return;
    const complex = await this.prisma.complex.findUnique({
      where: { id: complexId },
      select: { programId: true },
    });
    if (complex) await this.touch(complex.programId);
    this.logger.log(
      `Замена в комплексе: complexId=${complexId}, ${fromExerciseId} → ${toExerciseId}`,
    );
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

  /** Любая правка состава программы — по этой отметке друг узнаёт об обновлении. */
  private async touch(programId: number): Promise<void> {
    await this.prisma.program.update({
      where: { id: programId },
      data: { contentUpdatedAt: new Date() },
    });
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
    for (const complex of source.complexes) {
      const created = await tx.complex.create({
        data: { programId, name: complex.name, position: complex.position },
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
          },
        });
      }
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
        videoUrl: draft.videoUrl,
        equipment: draft.equipment,
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
