import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { SportAccountService } from '@/bot/sport-account.service';
import { parsePayload } from '@/sync/sync-payload';
import { SyncPushService } from '@/sync/sync-push.service';
import { SyncOpContext, SyncOpOutcome } from '@/sync/sync-op.types';

import { CooldownService } from './cooldown.service';
import { SyncCooldownBuildDto } from './dto/sync/sync-cooldown-build.dto';
import { SyncCooldownExcludeDto } from './dto/sync/sync-cooldown-exclude.dto';
import { SyncItemAddDto } from './dto/sync/sync-item-add.dto';
import { SyncItemReplaceDto } from './dto/sync/sync-item-replace.dto';
import { SyncSetAddDto } from './dto/sync/sync-set-add.dto';
import { SyncSetUpdateDto } from './dto/sync/sync-set-update.dto';
import { SyncWorkoutManualDto } from './dto/sync/sync-workout-manual.dto';
import { SyncWorkoutStartDto } from './dto/sync/sync-workout-start.dto';
import { WorkoutAppService } from './workout-app.service';
import { WorkoutService } from './workout.service';

const applied = (ids?: Record<string, number>): SyncOpOutcome => ({
  status: 'applied',
  ids,
});

const skipped = (reason: string): SyncOpOutcome => ({
  status: 'skipped',
  reason,
});

/**
 * Операции тренировки с телефона (офлайн-синк, этап 1). Каждая находит строку по clientId
 * и зовёт тот же сервис, что REST: правила одни. Повтор безопасен: создание проверяет clientId,
 * правка и удаление уже удалённого — skipped.
 */
@Injectable()
export class WorkoutSyncService implements OnModuleInit {
  private readonly logger = new Logger(`🏋️ ${WorkoutSyncService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: SyncPushService,
    private readonly accounts: SportAccountService,
    private readonly workouts: WorkoutService,
    private readonly app: WorkoutAppService,
    private readonly cooldowns: CooldownService,
  ) {}

  public onModuleInit() {
    const handlers: Record<string, (ctx: SyncOpContext) => Promise<SyncOpOutcome>> = {
      'workout.start': (ctx) => this.start(ctx),
      'workout.manual': (ctx) => this.manual(ctx),
      'set.add': (ctx) => this.addSet(ctx),
      'set.update': (ctx) => this.updateSet(ctx),
      'set.delete': (ctx) => this.deleteSet(ctx),
      'item.done': (ctx) => this.markDone(ctx),
      'item.replace': (ctx) => this.replace(ctx),
      'item.add': (ctx) => this.addItems(ctx),
      'item.remove': (ctx) => this.removeItem(ctx),
      'warmup.finish': (ctx) => this.mark(ctx, 'warmup'),
      'cooldown.start': (ctx) => this.mark(ctx, 'cooldownStart'),
      'cooldown.finish': (ctx) => this.mark(ctx, 'cooldownFinish'),
      'cooldown.build': (ctx) => this.cooldownBuild(ctx),
      'cooldown.exclude': (ctx) => this.cooldownExclude(ctx),
      'workout.finish': (ctx) => this.finish(ctx),
      'workout.discard': (ctx) => this.discard(ctx),
      'workout.delete': (ctx) => this.remove(ctx),
    };
    for (const [type, handler] of Object.entries(handlers))
      this.push.register(type, handler);
    this.logger.log(
      `Операции тренировки подключены к синку: ${Object.keys(handlers).length}`,
    );
  }

  // ── Тренировка ──────────────────────────────────────────────────────────

  private async start({ userId, op, at }: SyncOpContext) {
    const dto = await parsePayload(SyncWorkoutStartDto, op.payload);
    const profile = await this.accounts.profile(userId);
    const workout = await this.workouts.startFromClient(profile, {
      clientId: op.clientId,
      complexClientId: dto.complexClientId,
      date: dto.date,
      startedAt: at,
      items: dto.items,
    });
    return applied({
      [workout.clientId]: workout.id,
      ...Object.fromEntries(workout.exercises.map((e) => [e.clientId, e.id])),
    });
  }

  private async manual({ userId, op }: SyncOpContext) {
    const dto = await parsePayload(SyncWorkoutManualDto, op.payload);
    const profile = await this.accounts.profile(userId);
    const workout = await this.workouts.createManualFromClient(profile, {
      clientId: op.clientId,
      complexClientId: dto.complexClientId,
      date: dto.date,
      at: new Date(dto.at),
      items: dto.items,
    });
    return applied({
      [workout.clientId]: workout.id,
      ...Object.fromEntries(workout.exercises.map((e) => [e.clientId, e.id])),
    });
  }

  private async finish({ userId, op, at }: SyncOpContext) {
    const workout = await this.workoutOf(userId, op.clientId);
    if (!workout) return skipped('Тренировка удалена');
    if (workout.status !== 'IN_PROGRESS')
      return skipped('Тренировка уже засчитана');
    await this.app.finish(userId, workout.id, at);
    return applied();
  }

  private async discard({ userId, op }: SyncOpContext) {
    const workout = await this.workoutOf(userId, op.clientId);
    if (!workout) return skipped('Тренировка уже удалена');
    await this.workouts.discard(userId, workout.id);
    return applied();
  }

  private async remove({ userId, op }: SyncOpContext) {
    const workout = await this.workoutOf(userId, op.clientId);
    if (!workout) return skipped('Тренировка уже удалена');
    await this.app.remove(userId, workout.id);
    return applied();
  }

  private async mark(
    { userId, op, at }: SyncOpContext,
    what: 'warmup' | 'cooldownStart' | 'cooldownFinish',
  ) {
    const workout = await this.workoutOf(userId, op.clientId);
    if (!workout) return skipped('Тренировка удалена');
    if (what === 'warmup')
      await this.workouts.warmupFinish(userId, workout.id, at);
    else if (what === 'cooldownStart')
      await this.workouts.cooldownStart(userId, workout.id, at);
    else await this.workouts.cooldownFinish(userId, workout.id, at);
    return applied();
  }

  // ── Подходы ─────────────────────────────────────────────────────────────

  private async addSet({ userId, op }: SyncOpContext) {
    const dto = await parsePayload(SyncSetAddDto, op.payload);
    const item = await this.itemOf(userId, dto.itemClientId);
    if (!item) return skipped('Упражнение убрано из тренировки');
    await this.workouts.addSetValues(
      userId,
      item.id,
      dto.weight,
      dto.reps,
      op.clientId,
      {
        doneAt: dto.doneAt ? new Date(dto.doneAt) : undefined,
        workSeconds: dto.workSeconds ?? undefined,
        restTargetSeconds: dto.restTargetSeconds ?? undefined,
      },
    );
    const set = await this.setOf(userId, op.clientId);
    return applied(set ? { [op.clientId]: set.id } : undefined);
  }

  private async updateSet({ userId, op }: SyncOpContext) {
    const dto = await parsePayload(SyncSetUpdateDto, op.payload);
    const set = await this.setOf(userId, op.clientId);
    if (!set) return skipped('Подход уже удалён');
    await this.workouts.updateSet(userId, set.id, dto.weight, dto.reps);
    return applied();
  }

  private async deleteSet({ userId, op }: SyncOpContext) {
    const set = await this.setOf(userId, op.clientId);
    if (!set) return skipped('Подход уже удалён');
    await this.workouts.deleteSet(userId, set.id);
    return applied();
  }

  // ── Упражнения ──────────────────────────────────────────────────────────

  private async markDone({ userId, op }: SyncOpContext) {
    const item = await this.itemOf(userId, op.clientId);
    if (!item) return skipped('Упражнение убрано из тренировки');
    await this.workouts.markDone(userId, item.id);
    return applied();
  }

  private async replace({ userId, op }: SyncOpContext) {
    const dto = await parsePayload(SyncItemReplaceDto, op.payload);
    const item = await this.itemOf(userId, op.clientId);
    if (!item) return skipped('Упражнение убрано из тренировки');
    await this.workouts.replace(userId, item.id, dto.exerciseId, dto.inComplex);
    return applied();
  }

  private async addItems({ userId, op }: SyncOpContext) {
    const dto = await parsePayload(SyncItemAddDto, op.payload);
    const workout = await this.workoutOf(userId, op.clientId);
    if (!workout) return skipped('Тренировка удалена');
    const clientIds = dto.items.map((i) => i.clientId);
    const known = await this.prisma.workoutExercise.findMany({
      where: { clientId: { in: clientIds } },
      select: { clientId: true, id: true },
    });
    // Повтор: упражнения уже добавлены первым запросом
    if (!known.length)
      await this.workouts.addItems(
        userId,
        workout.id,
        dto.items.map((i) => i.exerciseId),
        dto.inComplex,
        clientIds,
      );
    const created = known.length
      ? known
      : await this.prisma.workoutExercise.findMany({
          where: { clientId: { in: clientIds } },
          select: { clientId: true, id: true },
        });
    return applied(Object.fromEntries(created.map((c) => [c.clientId, c.id])));
  }

  private async removeItem({ userId, op }: SyncOpContext) {
    const item = await this.itemOf(userId, op.clientId);
    if (!item) return skipped('Упражнение уже убрано');
    await this.workouts.removeItem(userId, item.id);
    return applied();
  }

  // ── Заминка ─────────────────────────────────────────────────────────────

  private async cooldownBuild({ userId, op }: SyncOpContext) {
    const dto = await parsePayload(SyncCooldownBuildDto, op.payload);
    const workout = await this.workoutOf(userId, op.clientId);
    if (!workout) return skipped('Тренировка удалена');
    const ids = await this.cooldowns.saveFromClient(
      workout.id,
      userId,
      dto.stretches,
    );
    return ids ? applied(ids) : skipped('У тренировки уже есть заминка');
  }

  private async cooldownExclude({ userId, op }: SyncOpContext) {
    const dto = await parsePayload(SyncCooldownExcludeDto, op.payload);
    const found = await this.cooldowns.excludeFromClient(
      userId,
      op.clientId,
      dto.stretchId,
      dto.nextStretchId,
      dto.exclusionClientId,
    );
    return found ? applied() : skipped('Растяжки уже нет в заминке');
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private workoutOf(userId: number, clientId: string) {
    return this.prisma.workout.findFirst({
      where: { clientId, userId },
      select: { id: true, status: true },
    });
  }

  private itemOf(userId: number, clientId: string) {
    return this.prisma.workoutExercise.findFirst({
      where: { clientId, workout: { userId } },
      select: { id: true },
    });
  }

  private setOf(userId: number, clientId: string) {
    return this.prisma.workoutSet.findFirst({
      where: { clientId, workoutExercise: { workout: { userId } } },
      select: { id: true },
    });
  }
}
