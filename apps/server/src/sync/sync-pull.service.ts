import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'prisma/prisma.service';

import { AvatarService } from '@/avatar/avatar.service';
import { zoneTitle } from '@/profile/profile.service';
import {
  friendName,
  fromTemplate,
  SOURCE_PROGRAM_SELECT,
  sourceUpdated,
} from '@/program/program-source';
import {
  PROGRAM_TAG_ORDER,
  PROGRAM_TAG_SELECT,
} from '@/program-tag/program-tag.service';

import { SyncPullResponseDto } from './dto/sync-pull.response.dto';
import {
  PULL_OVERLAP_MS,
  SYNC_RETENTION_DAYS,
  SYNC_RETENTION_MS,
} from './sync.constants';
import { dayOf, dayOrNull, timeOf, timeOrNull } from './sync-format';

const clientIdOf = { select: { clientId: true } } as const;

@Injectable()
export class SyncPullService {
  private readonly logger = new Logger(`🔄 ${SyncPullService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly avatars: AvatarService,
  ) {}

  /**
   * Изменённые с since строки пользователя и удалённые с since. Без since или с курсором
   * старше срока хранения надгробий — полный снимок.
   */
  public async pull(
    userId: number,
    since?: string,
  ): Promise<SyncPullResponseDto> {
    const startedAt = Date.now();
    const sinceDate = since ? new Date(since) : null;
    const full = !sinceDate || startedAt - +sinceDate > SYNC_RETENTION_MS;
    if (sinceDate && full) {
      this.logger.warn(
        `Курсор старше ${SYNC_RETENTION_DAYS} дней — отдаём полный снимок: userId=${userId}, since=${since}`,
      );
    }
    const changed = full ? {} : { updatedAt: { gt: sinceDate } };
    const ownWorkout = { workout: { userId } };

    const [
      profile,
      user,
      programs,
      complexes,
      complexExercises,
      planDays,
      workouts,
      workoutExercises,
      workoutSets,
      workoutStretches,
      pauses,
      limitations,
      stretchExclusions,
      stretchSessions,
      bodyWeights,
      deleted,
    ] = await Promise.all([
      // Профиль — одна строка, отдаём всегда: аватар и пояс живут не только в ней,
      // их смена updatedAt профиля не двигает
      this.prisma.sportProfile.findUnique({
        where: { userId },
        include: { activeProgram: clientIdOf, nextComplex: clientIdOf },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { avatarPath: true },
      }),
      this.prisma.program.findMany({
        where: {
          ownerId: userId,
          isTemplate: false,
          // Правка источника копии меняет плашку «обновилась», а строку копии не трогает
          ...(full
            ? {}
            : {
                OR: [
                  changed,
                  { sourceProgram: { contentUpdatedAt: { gt: sinceDate } } },
                ],
              }),
        },
        include: {
          tags: { orderBy: PROGRAM_TAG_ORDER, select: PROGRAM_TAG_SELECT },
          _count: { select: { copies: true } },
          sourceProgram: SOURCE_PROGRAM_SELECT,
        },
      }),
      this.prisma.complex.findMany({
        where: { program: { ownerId: userId, isTemplate: false }, ...changed },
        include: { program: clientIdOf },
      }),
      this.prisma.complexExercise.findMany({
        where: {
          complex: { program: { ownerId: userId, isTemplate: false } },
          ...changed,
        },
        include: { complex: clientIdOf },
      }),
      this.prisma.planDay.findMany({
        where: { userId, ...changed },
        include: { suggestedComplex: clientIdOf, workout: clientIdOf },
      }),
      this.prisma.workout.findMany({
        where: { userId, ...changed },
        include: { complex: clientIdOf },
      }),
      this.prisma.workoutExercise.findMany({
        where: { ...ownWorkout, ...changed },
        include: { workout: clientIdOf },
      }),
      this.prisma.workoutSet.findMany({
        where: { workoutExercise: ownWorkout, ...changed },
        include: { workoutExercise: clientIdOf },
      }),
      this.prisma.workoutStretch.findMany({
        where: { ...ownWorkout, ...changed },
        include: { workout: clientIdOf },
      }),
      this.prisma.pause.findMany({ where: { userId, ...changed } }),
      this.prisma.limitation.findMany({ where: { userId, ...changed } }),
      this.prisma.stretchExclusion.findMany({ where: { userId, ...changed } }),
      this.prisma.stretchSession.findMany({ where: { userId, ...changed } }),
      this.prisma.bodyWeight.findMany({ where: { userId, ...changed } }),
      full
        ? Promise.resolve([])
        : this.prisma.syncTombstone.findMany({
            where: { userId, deletedAt: { gt: sinceDate } },
            select: { entity: true, clientId: true },
          }),
    ]);

    const response: SyncPullResponseDto = {
      cursor: new Date(startedAt - PULL_OVERLAP_MS).toISOString(),
      full,
      profile: profile && {
        displayName: profile.displayName,
        avatarUrl: this.avatars.url(user?.avatarPath ?? null),
        timeZone: profile.timeZone,
        timeZoneTitle: zoneTitle(profile.timeZone),
        gender: profile.gender,
        trainingDays: profile.trainingDays,
        morningTime: profile.morningTime,
        eveningTime: profile.eveningTime,
        remindersEnabled: profile.remindersEnabled,
        questionsEnabled: profile.questionsEnabled,
        weightAskFrequency: profile.weightAskFrequency,
        activeProgramId: profile.activeProgramId,
        activeProgramClientId: profile.activeProgram?.clientId ?? null,
        nextComplexId: profile.nextComplexId,
        nextComplexClientId: profile.nextComplex?.clientId ?? null,
        onboardingStep: profile.onboardingStep,
        onboardedAt: timeOrNull(profile.onboardedAt),
        currentStreak: profile.currentStreak,
        bestStreak: profile.bestStreak,
        missedInRow: profile.missedInRow,
        showRestTimer: profile.showRestTimer,
        restSeconds: profile.restSeconds,
        restAutoStart: profile.restAutoStart,
        timerSound: profile.timerSound,
        timerVibration: profile.timerVibration,
        warmupMinutes: profile.warmupMinutes,
        createdAt: timeOf(profile.createdAt),
        updatedAt: timeOf(profile.updatedAt),
      },
      programs: programs.map((p) => ({
        id: p.id,
        clientId: p.clientId,
        name: p.name,
        sourceProgramId: p.sourceProgramId,
        sourceSyncedAt: timeOrNull(p.sourceSyncedAt),
        sourceDismissedAt: timeOrNull(p.sourceDismissedAt),
        contentUpdatedAt: timeOf(p.contentUpdatedAt),
        publication: p.publication,
        description: p.description,
        fromFriend: friendName(p),
        fromTemplate: fromTemplate(p),
        sourceUpdated: sourceUpdated(p),
        isPublished: p.isPublished,
        addedCount: p._count.copies,
        textPending: !!p.reviewRequestedAt,
        rejectReason: p.rejectReason,
        tags: p.tags,
        createdAt: timeOf(p.createdAt),
        updatedAt: timeOf(p.updatedAt),
      })),
      complexes: complexes.map((c) => ({
        id: c.id,
        clientId: c.clientId,
        programId: c.programId,
        programClientId: c.program.clientId,
        name: c.name,
        position: c.position,
        cardioName: c.cardioName,
        cardioMinutes: c.cardioMinutes,
        warmupMinutes: c.warmupMinutes,
        updatedAt: timeOf(c.updatedAt),
      })),
      complexExercises: complexExercises.map((e) => ({
        id: e.id,
        clientId: e.clientId,
        complexId: e.complexId,
        complexClientId: e.complex.clientId,
        exerciseId: e.exerciseId,
        position: e.position,
        sets: e.sets,
        repsMin: e.repsMin,
        repsMax: e.repsMax,
        superset: e.superset,
        updatedAt: timeOf(e.updatedAt),
      })),
      planDays: planDays.map((d) => ({
        id: d.id,
        clientId: d.clientId,
        date: dayOf(d.date),
        type: d.type,
        status: d.status,
        morningAnswer: d.morningAnswer,
        eveningAnswer: d.eveningAnswer,
        suggestedComplexId: d.suggestedComplexId,
        suggestedComplexClientId: d.suggestedComplex?.clientId ?? null,
        workoutId: d.workoutId,
        workoutClientId: d.workout?.clientId ?? null,
        rescheduleOfferedAt: timeOrNull(d.rescheduleOfferedAt),
        eveningAskedAt: timeOrNull(d.eveningAskedAt),
        updatedAt: timeOf(d.updatedAt),
      })),
      workouts: workouts.map((w) => ({
        id: w.id,
        clientId: w.clientId,
        complexId: w.complexId,
        complexClientId: w.complex?.clientId ?? null,
        complexName: w.complexName,
        cardioName: w.cardioName,
        cardioMinutes: w.cardioMinutes,
        date: dayOf(w.date),
        mode: w.mode,
        status: w.status,
        unplanned: w.unplanned,
        startedAt: timeOf(w.startedAt),
        finishedAt: timeOrNull(w.finishedAt),
        warmupMinutes: w.warmupMinutes,
        warmupFinishedAt: timeOrNull(w.warmupFinishedAt),
        cooldownStartedAt: timeOrNull(w.cooldownStartedAt),
        cooldownFinishedAt: timeOrNull(w.cooldownFinishedAt),
        updatedAt: timeOf(w.updatedAt),
      })),
      workoutExercises: workoutExercises.map((e) => ({
        id: e.id,
        clientId: e.clientId,
        workoutId: e.workoutId,
        workoutClientId: e.workout.clientId,
        exerciseId: e.exerciseId,
        position: e.position,
        done: e.done,
        plannedSets: e.plannedSets,
        repsMin: e.repsMin,
        repsMax: e.repsMax,
        superset: e.superset,
        replacedExerciseId: e.replacedExerciseId,
        updatedAt: timeOf(e.updatedAt),
      })),
      workoutSets: workoutSets.map((s) => ({
        id: s.id,
        clientId: s.clientId,
        workoutExerciseId: s.workoutExerciseId,
        workoutExerciseClientId: s.workoutExercise.clientId,
        number: s.number,
        weight: Number(s.weight),
        reps: s.reps,
        doneAt: timeOrNull(s.doneAt),
        workSeconds: s.workSeconds,
        restTargetSeconds: s.restTargetSeconds,
        updatedAt: timeOf(s.updatedAt),
      })),
      workoutStretches: workoutStretches.map((s) => ({
        id: s.id,
        clientId: s.clientId,
        workoutId: s.workoutId,
        workoutClientId: s.workout.clientId,
        stretchId: s.stretchId,
        block: s.block,
        position: s.position,
        updatedAt: timeOf(s.updatedAt),
      })),
      pauses: pauses.map((p) => ({
        id: p.id,
        clientId: p.clientId,
        startDate: dayOf(p.startDate),
        endDate: dayOrNull(p.endDate),
        origin: p.origin,
        endedAt: timeOrNull(p.endedAt),
        updatedAt: timeOf(p.updatedAt),
      })),
      limitations: limitations.map((l) => ({
        id: l.id,
        clientId: l.clientId,
        jointId: l.jointId,
        startDate: dayOf(l.startDate),
        endDate: dayOrNull(l.endDate),
        cancelledAt: timeOrNull(l.cancelledAt),
        updatedAt: timeOf(l.updatedAt),
      })),
      stretchExclusions: stretchExclusions.map((e) => ({
        clientId: e.clientId,
        stretchId: e.stretchId,
        updatedAt: timeOf(e.updatedAt),
      })),
      stretchSessions: stretchSessions.map((s) => ({
        id: s.id,
        clientId: s.clientId,
        routineId: s.routineId,
        routineName: s.routineName,
        date: dayOf(s.date),
        startedAt: timeOf(s.startedAt),
        finishedAt: timeOrNull(s.finishedAt),
        updatedAt: timeOf(s.updatedAt),
      })),
      bodyWeights: bodyWeights.map((b) => ({
        id: b.id,
        clientId: b.clientId,
        date: dayOf(b.date),
        value: Number(b.value),
        updatedAt: timeOf(b.updatedAt),
      })),
      deleted,
    };

    this.logger.log(
      `Pull: userId=${userId}, full=${full}, since=${since ?? '—'}, тренировок=${workouts.length}, подходов=${workoutSets.length}, программ=${programs.length}, удалено=${deleted.length}, ${Date.now() - startedAt} мс`,
    );
    return response;
  }

  /** Надгробия и журнал операций старше срока хранения больше не нужны: такой курсор получит полный снимок. */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  public async cleanup() {
    const cutoff = new Date(Date.now() - SYNC_RETENTION_MS);
    try {
      const [tombstones, ops] = await this.prisma.$transaction([
        this.prisma.syncTombstone.deleteMany({
          where: { deletedAt: { lt: cutoff } },
        }),
        this.prisma.syncOp.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      ]);
      this.logger.log(
        `🧹 Очистка синка: надгробий=${tombstones.count}, операций=${ops.count}, старше ${SYNC_RETENTION_DAYS} дней`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Ошибка очистки синка: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
