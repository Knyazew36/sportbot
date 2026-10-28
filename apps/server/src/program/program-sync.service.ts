import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { freshFields } from '@/sync/field-stamps';
import { parsePayload } from '@/sync/sync-payload';
import { SyncPushService } from '@/sync/sync-push.service';
import { SyncOpContext, SyncOpOutcome } from '@/sync/sync-op.types';

import { SyncComplexAddDto } from './dto/sync/sync-complex-add.dto';
import { SyncComplexItemsAddDto } from './dto/sync/sync-complex-items-add.dto';
import { SyncComplexUpdateDto } from './dto/sync/sync-complex-update.dto';
import { SyncNameDto } from './dto/sync/sync-name.dto';
import { SyncPlanDto } from './dto/sync/sync-plan.dto';
import { SyncReorderDto } from './dto/sync/sync-reorder.dto';
import { SyncSupersetDto } from './dto/sync/sync-superset.dto';
import { ProgramAppService } from './program-app.service';
import { ProgramService } from './program.service';

const applied = (ids?: Record<string, number>): SyncOpOutcome => ({
  status: 'applied',
  ids,
});
const gone = (reason: string): SyncOpOutcome => ({ status: 'skipped', reason });
/** Все поля правки позже изменены в другом месте — правка телефона устарела */
const outdated = (): SyncOpOutcome => ({
  status: 'skipped',
  reason: 'Изменено позже на другом устройстве',
});

/**
 * Редактор программ с телефона (офлайн-синк, этап 3). Строки находятся по clientId и правятся
 * тем же сервисом, что и в приложении. Создание повторно не плодит строк: clientId уже есть — applied.
 * Порядок приходит списком clientId: неизвестные пропускаются, свои отсутствующие встают в конец.
 * Правка полей применяется только к тем, что не правили позже времени операции (fieldUpdatedAt)
 */
@Injectable()
export class ProgramSyncService implements OnModuleInit {
  private readonly logger = new Logger(`📋 ${ProgramSyncService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: SyncPushService,
    private readonly programs: ProgramService,
    private readonly app: ProgramAppService,
  ) {}

  public onModuleInit() {
    const handlers: Record<string, (ctx: SyncOpContext) => Promise<SyncOpOutcome>> = {
      'program.create': (ctx) => this.create(ctx),
      'program.rename': (ctx) => this.rename(ctx),
      'program.delete': (ctx) => this.remove(ctx),
      'program.activate': (ctx) => this.activate(ctx),
      'complex.add': (ctx) => this.addComplex(ctx),
      'complex.update': (ctx) => this.updateComplex(ctx),
      'complex.delete': (ctx) => this.removeComplex(ctx),
      'complex.reorder': (ctx) => this.reorderComplexes(ctx),
      'complex.makeNext': (ctx) => this.makeNext(ctx),
      'complexItem.add': (ctx) => this.addItems(ctx),
      'complexItem.update': (ctx) => this.updateItem(ctx),
      'complexItem.delete': (ctx) => this.removeItem(ctx),
      'complexItem.reorder': (ctx) => this.reorderItems(ctx),
      'complexItem.ungroup': (ctx) => this.ungroupItem(ctx),
      'superset.ungroup': (ctx) => this.ungroupSuperset(ctx),
    };
    for (const [type, handler] of Object.entries(handlers))
      this.push.register(type, handler);
    this.logger.log(
      `Операции программ подключены к синку: ${Object.keys(handlers).length}`,
    );
  }

  // ── Программа ───────────────────────────────────────────────────────────

  private async create({ userId, op }: SyncOpContext) {
    const { name } = await parsePayload(SyncNameDto, op.payload);
    const existing = await this.programOf(userId, op.clientId);
    const program =
      existing ?? (await this.programs.create(userId, name, op.clientId));
    return applied({ [op.clientId]: program.id });
  }

  private async rename({ userId, op, at }: SyncOpContext) {
    const dto = await parsePayload(SyncNameDto, op.payload);
    const program = await this.programOf(userId, op.clientId);
    if (!program) return gone('Программа удалена');
    const { name } = freshFields(dto, program.fieldUpdatedAt, at);
    if (name === undefined) return outdated();
    await this.app.update(userId, program.id, { name }, at);
    return applied();
  }

  private async remove({ userId, op }: SyncOpContext) {
    const program = await this.programOf(userId, op.clientId);
    if (!program) return gone('Программа уже удалена');
    await this.app.remove(userId, program.id);
    return applied();
  }

  private async activate({ userId, op }: SyncOpContext) {
    const program = await this.programOf(userId, op.clientId);
    if (!program) return gone('Программа удалена');
    await this.programs.setActive(userId, program.id);
    return applied();
  }

  // ── Комплексы ───────────────────────────────────────────────────────────

  private async addComplex({ userId, op }: SyncOpContext) {
    const dto = await parsePayload(SyncComplexAddDto, op.payload);
    const existing = await this.complexOf(userId, op.clientId);
    if (existing) return applied({ [op.clientId]: existing.id });
    const program = await this.programOf(userId, dto.programClientId);
    if (!program) return gone('Программа удалена');
    const complex = await this.programs.addComplex(
      userId,
      program.id,
      dto.name,
      op.clientId,
    );
    return applied({ [op.clientId]: complex.id });
  }

  private async updateComplex({ userId, op, at }: SyncOpContext) {
    const dto = await parsePayload(SyncComplexUpdateDto, op.payload);
    const complex = await this.complexOf(userId, op.clientId);
    if (!complex) return gone('Тренировка удалена');
    const fields = freshFields(dto, complex.fieldUpdatedAt, at);
    if (!Object.keys(fields).length) return outdated();
    await this.app.updateComplex(userId, complex.id, fields, at);
    return applied();
  }

  private async removeComplex({ userId, op }: SyncOpContext) {
    const complex = await this.complexOf(userId, op.clientId);
    if (!complex) return gone('Тренировка уже удалена');
    await this.programs.removeComplex(userId, complex.id);
    return applied();
  }

  private async reorderComplexes({ userId, op }: SyncOpContext) {
    const { ids } = await parsePayload(SyncReorderDto, op.payload);
    const program = await this.programOf(userId, op.clientId);
    if (!program) return gone('Программа удалена');
    const rows = await this.prisma.complex.findMany({
      where: { programId: program.id },
      orderBy: { position: 'asc' },
      select: { id: true, clientId: true },
    });
    await this.programs.reorderComplexes(
      userId,
      program.id,
      this.ordered(rows, ids),
    );
    return applied();
  }

  private async makeNext({ userId, op }: SyncOpContext) {
    const complex = await this.complexOf(userId, op.clientId);
    if (!complex) return gone('Тренировка удалена');
    await this.programs.setNext(userId, complex.id);
    return applied();
  }

  // ── Упражнения комплекса ────────────────────────────────────────────────

  private async addItems({ userId, op }: SyncOpContext) {
    const dto = await parsePayload(SyncComplexItemsAddDto, op.payload);
    const complex = await this.complexOf(userId, op.clientId);
    if (!complex) return gone('Тренировка удалена');
    const clientIds = dto.items.map((i) => i.clientId);
    const known = await this.prisma.complexExercise.findMany({
      where: { clientId: { in: clientIds } },
      select: { id: true, clientId: true },
    });
    if (!known.length) {
      const join = dto.joinItemClientId
        ? await this.itemOf(userId, dto.joinItemClientId)
        : null;
      await this.programs.addExercises(
        userId,
        complex.id,
        dto.items.map((i) => i.exerciseId),
        { joinItemId: join?.id, newSuperset: dto.newSuperset },
        clientIds,
      );
    }
    const created = await this.prisma.complexExercise.findMany({
      where: { clientId: { in: clientIds } },
      select: { id: true, clientId: true },
    });
    return applied(Object.fromEntries(created.map((c) => [c.clientId, c.id])));
  }

  private async updateItem({ userId, op, at }: SyncOpContext) {
    const plan = await parsePayload(SyncPlanDto, op.payload);
    const item = await this.itemOf(userId, op.clientId);
    if (!item) return gone('Упражнение убрано');
    // План отмечается целиком (ProgramService.updatePlan)
    if (!freshFields({ plan }, item.fieldUpdatedAt, at).plan) return outdated();
    await this.programs.updatePlan(userId, item.id, plan, at);
    return applied();
  }

  private async removeItem({ userId, op }: SyncOpContext) {
    const item = await this.itemOf(userId, op.clientId);
    if (!item) return gone('Упражнение уже убрано');
    await this.programs.removeItem(userId, item.id);
    return applied();
  }

  private async reorderItems({ userId, op }: SyncOpContext) {
    const { ids } = await parsePayload(SyncReorderDto, op.payload);
    const complex = await this.complexOf(userId, op.clientId);
    if (!complex) return gone('Тренировка удалена');
    const rows = await this.prisma.complexExercise.findMany({
      where: { complexId: complex.id },
      orderBy: { position: 'asc' },
      select: { id: true, clientId: true },
    });
    await this.programs.reorderItems(
      userId,
      complex.id,
      this.ordered(rows, ids),
    );
    return applied();
  }

  private async ungroupItem({ userId, op }: SyncOpContext) {
    const item = await this.itemOf(userId, op.clientId);
    if (!item) return gone('Упражнение убрано');
    if (item.superset === null) return gone('Упражнение уже не в суперсете');
    await this.programs.ungroupItem(userId, item.id);
    return applied();
  }

  private async ungroupSuperset({ userId, op }: SyncOpContext) {
    const { superset } = await parsePayload(SyncSupersetDto, op.payload);
    const complex = await this.complexOf(userId, op.clientId);
    if (!complex) return gone('Тренировка удалена');
    const exists = await this.prisma.complexExercise.count({
      where: { complexId: complex.id, superset },
    });
    if (!exists) return gone('Суперсета уже нет');
    await this.programs.ungroupSuperset(userId, complex.id, superset);
    return applied();
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /**
   * Порядок с телефона в id сервера: удалённые на сервере пропускаются, добавленные там,
   * но не известные телефону, остаются в конце в прежнем порядке
   */
  private ordered(
    rows: { id: number; clientId: string }[],
    clientIds: string[],
  ): number[] {
    const byClient = new Map(rows.map((r) => [r.clientId, r.id]));
    const known = clientIds
      .map((c) => byClient.get(c))
      .filter((id): id is number => id !== undefined);
    const rest = rows.map((r) => r.id).filter((id) => !known.includes(id));
    return [...known, ...rest];
  }

  private programOf(userId: number, clientId: string) {
    return this.prisma.program.findFirst({
      where: { clientId, ownerId: userId, isTemplate: false },
      select: { id: true, fieldUpdatedAt: true },
    });
  }

  private complexOf(userId: number, clientId: string) {
    return this.prisma.complex.findFirst({
      where: { clientId, program: { ownerId: userId, isTemplate: false } },
      select: { id: true, fieldUpdatedAt: true },
    });
  }

  private itemOf(userId: number, clientId: string) {
    return this.prisma.complexExercise.findFirst({
      where: {
        clientId,
        complex: { program: { ownerId: userId, isTemplate: false } },
      },
      select: { id: true, superset: true, fieldUpdatedAt: true },
    });
  }
}
