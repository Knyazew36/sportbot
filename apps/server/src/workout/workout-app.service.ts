import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { localToday } from '@/bot';
import { SportAccountService } from '@/bot/sport-account.service';
import { imageCredit } from '@/catalog/dto/image-credit.response.dto';
import { SportProfile } from '@/generated/prisma/client';
import { LimitationService } from '@/limitation/limitation.service';
import { PlanDayService } from '@/plan/plan-day.service';
import { ProgramService } from '@/program/program.service';
import { StatsService } from '@/stats/stats.service';
import { UploadService } from '@/upload/upload.service';

import { StretchFull } from '@/catalog/catalog.service';

import { CooldownView } from './cooldown.service';
import { CooldownStretchResponseDto } from './dto/cooldown-stretch.response.dto';
import { cooldownStretchView } from './cooldown-stretch-view';
import { CooldownResponseDto } from './dto/cooldown.response.dto';
import { CreateWorkoutSetDto } from './dto/create-workout-set.dto';
import { WorkoutAnalogResponseDto } from './dto/workout-analog.response.dto';
import { WorkoutCurrentResponseDto } from './dto/workout-current.response.dto';
import { WorkoutItemResponseDto } from './dto/workout-item.response.dto';
import { WorkoutSummaryResponseDto } from './dto/workout-summary.response.dto';
import { WorkoutTimingResponseDto } from './dto/workout-timing.response.dto';
import { WorkoutResponseDto } from './dto/workout.response.dto';
import { workoutTiming } from './workout-timing';
import {
  canComplete,
  isDone,
  WorkoutExerciseFull,
  WorkoutFull,
  WorkoutService,
  workoutTotals,
} from './workout.service';

type MuscleLink = { role: string; muscle: { name: string } };

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

const primaryMuscles = (muscles: MuscleLink[]): string =>
  muscles
    .filter((m) => m.role === 'PRIMARY')
    .map((m) => m.muscle.name)
    .join(' · ');

/** Тренировка в Mini App (frontend-tz, 8): ответы экрану поверх WorkoutService, общего с ботом. */
@Injectable()
export class WorkoutAppService {
  private readonly logger = new Logger(`🏋️ ${WorkoutAppService.name}`);

  constructor(
    private readonly workouts: WorkoutService,
    private readonly accounts: SportAccountService,
    private readonly programs: ProgramService,
    private readonly planDays: PlanDayService,
    private readonly limitations: LimitationService,
    private readonly uploads: UploadService,
    private readonly stats: StatsService,
  ) {}

  // ── Чтение ──────────────────────────────────────────────────────────────

  public async current(userId: number): Promise<WorkoutCurrentResponseDto> {
    const profile = await this.accounts.profile(userId);
    const workout = await this.workouts.current(userId);
    return { workout: workout ? await this.view(profile, workout) : null };
  }

  public async find(
    userId: number,
    workoutId: number,
  ): Promise<WorkoutResponseDto> {
    const profile = await this.accounts.profile(userId);
    return this.view(profile, await this.workouts.find(userId, workoutId));
  }

  /** Итог тренировки: время, подходы, серия и личные рекорды (frontend-tz, 8.6). */
  public async summary(
    userId: number,
    workoutId: number,
  ): Promise<WorkoutSummaryResponseDto> {
    const [profile, workout] = await Promise.all([
      this.accounts.profile(userId),
      this.workouts.find(userId, workoutId),
    ]);
    const records = await this.stats.records(userId, workout);
    return {
      workoutId: workout.id,
      complexName: workout.complexName,
      status: workout.status,
      ...workoutTotals(workout),
      currentStreak: profile.currentStreak,
      cardioName: workout.cardioName,
      cardioMinutes: workout.cardioMinutes,
      records,
      timing: this.timingView(workout),
    };
  }

  // ── Начало и конец ──────────────────────────────────────────────────────

  /**
   * Начать тренировку: выбранный комплекс или комплекс дня по очереди. Начатая уже есть — вернётся она:
   * тренировку, начатую в боте, приложение продолжает (frontend-tz, 4.1).
   */
  public async start(
    userId: number,
    complexId?: number,
  ): Promise<WorkoutResponseDto> {
    const profile = await this.accounts.profile(userId);
    const id = complexId ?? (await this.complexOfDay(profile));
    if (!id)
      throw new BadRequestException(
        'Нет активной программы с тренировками — возьми шаблон или собери свою.',
      );
    const workout = await this.workouts.start(profile, id);
    this.logger.log(
      `Старт из приложения: workoutId=${workout.id}, userId=${userId}, complexId=${id}`,
    );
    return this.view(profile, workout);
  }

  /** Добавить прошедшую тренировку вручную: закрыта сразу, подходы — на экране исправления. */
  public async createManual(
    userId: number,
    complexId: number,
    date: string,
  ): Promise<WorkoutResponseDto> {
    const profile = await this.accounts.profile(userId);
    const workout = await this.workouts.createManual(
      profile,
      complexId,
      new Date(`${date}T00:00:00.000Z`),
    );
    return this.view(profile, workout);
  }

  /** «Завершить»: засчитывается, если сделано хотя бы одно упражнение (business-tz, 7.3). */
  public async finish(
    userId: number,
    workoutId: number,
    finishedAt?: Date,
  ): Promise<WorkoutSummaryResponseDto> {
    const profile = await this.accounts.profile(userId);
    const workout = await this.workouts.find(userId, workoutId);
    // Повтор из офлайн-очереди: первый запрос дошёл, ответ потерялся — отдаём тот же итог
    if (workout.status !== 'IN_PROGRESS') {
      this.logger.warn(
        `Повторное завершение: workoutId=${workoutId}, userId=${userId}, статус=${workout.status}`,
      );
      return this.summary(userId, workoutId);
    }
    if (!canComplete(workout))
      throw new BadRequestException(
        'Пока не сделано ни одного упражнения — засчитывать нечего.',
      );
    // Время с клиента не раньше старта и последнего подхода и не из будущего
    const now = Date.now();
    const lastDone = Math.max(
      workout.startedAt.getTime(),
      ...workout.exercises.flatMap((e) =>
        e.sets.flatMap((s) => (s.doneAt ? [s.doneAt.getTime()] : [])),
      ),
    );
    let at: Date | undefined;
    if (finishedAt) {
      at = new Date(Math.min(now, Math.max(lastDone, +finishedAt)));
      if (+at !== +finishedAt)
        this.logger.warn(
          `Время завершения срезано: workoutId=${workoutId}, userId=${userId}, пришло=${finishedAt.toISOString()}, стало=${at.toISOString()}`,
        );
    }
    await this.workouts.complete(profile, workoutId, { finishedAt: at });
    return this.summary(userId, workoutId);
  }

  /** Отменить незавершённую тренировку: очередь комплексов не сдвигается. */
  public async discard(userId: number, workoutId: number): Promise<void> {
    await this.workouts.discard(userId, workoutId);
  }

  /** Удалить закрытую тренировку: день освобождается, серия пересчитывается. */
  public async remove(userId: number, workoutId: number): Promise<void> {
    const profile = await this.accounts.profile(userId);
    await this.workouts.remove(profile, workoutId);
  }

  // ── Подходы и упражнения ────────────────────────────────────────────────

  public async addSet(
    userId: number,
    dto: CreateWorkoutSetDto,
  ): Promise<WorkoutResponseDto> {
    const workoutId = await this.workouts.addSetValues(
      userId,
      dto.itemId,
      dto.weight ?? 0,
      dto.reps,
      dto.clientId,
      {
        doneAt: dto.doneAt ? new Date(dto.doneAt) : undefined,
        workSeconds: dto.workSeconds,
        restTargetSeconds: dto.restTargetSeconds,
      },
    );
    return this.find(userId, workoutId);
  }

  public async updateSet(
    userId: number,
    setId: number,
    weight: number,
    reps: number,
  ): Promise<WorkoutResponseDto> {
    const workoutId = await this.workouts.updateSet(
      userId,
      setId,
      weight,
      reps,
    );
    return this.find(userId, workoutId);
  }

  public async deleteSet(
    userId: number,
    setId: number,
  ): Promise<WorkoutResponseDto> {
    const workoutId = await this.workouts.deleteSet(userId, setId);
    return this.find(userId, workoutId);
  }

  /** «Упражнение сделано» — даже без подходов. */
  public async markDone(
    userId: number,
    itemId: number,
  ): Promise<WorkoutResponseDto> {
    const workoutId = await this.workouts.markDone(userId, itemId);
    this.logger.log(`Упражнение сделано: itemId=${itemId}, userId=${userId}`);
    return this.find(userId, workoutId);
  }

  /** Аналоги для замены: те же основные мышцы, без зон с ограничением (business-tz, 7.4). */
  public async analogs(
    userId: number,
    itemId: number,
  ): Promise<WorkoutAnalogResponseDto[]> {
    const profile = await this.accounts.profile(userId);
    const { analogs } = await this.workouts.analogs(profile, itemId);
    return analogs.map((a) => ({
      id: a.id,
      name: a.name,
      muscles: primaryMuscles(a.muscles),
      imageUrl: this.uploads.toPublicUrl(a.imagePath),
      draft: a.status === 'DRAFT',
    }));
  }

  public async replace(
    userId: number,
    itemId: number,
    exerciseId: number,
    inComplex: boolean,
  ): Promise<WorkoutResponseDto> {
    const workoutId = await this.workouts.replace(
      userId,
      itemId,
      exerciseId,
      inComplex,
    );
    return this.find(userId, workoutId);
  }

  public async addItems(
    userId: number,
    workoutId: number,
    exerciseIds: number[],
    inComplex: boolean,
  ): Promise<WorkoutResponseDto> {
    await this.workouts.addItems(userId, workoutId, exerciseIds, inComplex);
    return this.find(userId, workoutId);
  }

  public async removeItem(
    userId: number,
    itemId: number,
  ): Promise<WorkoutResponseDto> {
    const workoutId = await this.workouts.removeItem(userId, itemId);
    return this.find(userId, workoutId);
  }

  // ── Заминка ─────────────────────────────────────────────────────────────

  /** Заминка тренировки (business-tz, 7.5): набор собирается один раз и при повторном открытии не меняется. */
  public async cooldown(
    userId: number,
    workoutId: number,
  ): Promise<CooldownResponseDto> {
    const view = await this.workouts.cooldown(userId, workoutId);
    this.logger.log(
      `Заминка открыта: workoutId=${workoutId}, userId=${userId}, растяжек=${view.main.length}+${view.optional.length}`,
    );
    return this.cooldownView(userId, workoutId, view);
  }

  /** «Не предлагать» в заминке: ответ — заминка уже с заменой, экран перерисовывается без запроса. */
  public async cooldownExclude(
    userId: number,
    workoutId: number,
    stretchId: number,
  ): Promise<CooldownResponseDto> {
    const view = await this.workouts.cooldownExclude(
      userId,
      workoutId,
      stretchId,
    );
    return this.cooldownView(userId, workoutId, view);
  }

  /** «Другая»: замена только в этой заминке, ответ — заминка уже с заменой. */
  public async cooldownSwap(
    userId: number,
    workoutId: number,
    stretchId: number,
  ): Promise<CooldownResponseDto> {
    const view = await this.workouts.cooldownSwap(
      userId,
      workoutId,
      stretchId,
    );
    return this.cooldownView(userId, workoutId, view);
  }

  /** Ещё растяжка: случайная или на выбранную мышцу, ответ — заминка уже с ней. */
  public async cooldownAdd(
    userId: number,
    workoutId: number,
    muscleId?: number,
  ): Promise<CooldownResponseDto> {
    const view = await this.workouts.cooldownAdd(userId, workoutId, muscleId);
    return this.cooldownView(userId, workoutId, view);
  }

  /** Готовый комплекс вместо набора заминки: ответ — заминка уже с ним. */
  public async cooldownRoutine(
    userId: number,
    workoutId: number,
    routineId: number,
  ): Promise<CooldownResponseDto> {
    const view = await this.workouts.cooldownRoutine(
      userId,
      workoutId,
      routineId,
    );
    return this.cooldownView(userId, workoutId, view);
  }

  public async warmupFinish(
    userId: number,
    workoutId: number,
    at?: Date,
  ): Promise<void> {
    await this.workouts.warmupFinish(userId, workoutId, at);
  }

  public async cooldownStart(
    userId: number,
    workoutId: number,
    at?: Date,
  ): Promise<void> {
    await this.workouts.cooldownStart(userId, workoutId, at);
  }

  public async cooldownFinish(
    userId: number,
    workoutId: number,
    at?: Date,
  ): Promise<void> {
    await this.workouts.cooldownFinish(userId, workoutId, at);
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private timingView(workout: WorkoutFull): WorkoutTimingResponseDto | null {
    const timing = workoutTiming(workout);
    if (!timing) return null;
    const { restBefore: _restBefore, ...totals } = timing;
    return totals;
  }

  private async cooldownView(
    userId: number,
    workoutId: number,
    view: CooldownView,
  ): Promise<CooldownResponseDto> {
    const profile = await this.accounts.profile(userId);
    const seconds = (list: StretchFull[]) =>
      list.reduce((sum, s) => sum + s.holdSeconds * (s.perSide ? 2 : 1), 0);
    return {
      workoutId,
      minutes: view.minutes,
      optionalMinutes: Math.ceil(seconds(view.optional) / 60),
      timerSound: profile.timerSound,
      timerVibration: profile.timerVibration,
      main: view.main.map((s) => this.stretchView(s)),
      optional: view.optional.map((s) => this.stretchView(s)),
    };
  }

  private stretchView(stretch: StretchFull): CooldownStretchResponseDto {
    return cooldownStretchView(stretch, (path) =>
      this.uploads.toPublicUrl(path),
    );
  }

  /** Комплекс дня: выбранный утром или вручную, иначе следующий по очереди. */
  private async complexOfDay(profile: SportProfile): Promise<number | null> {
    const day = await this.planDays.find(
      profile.userId,
      localToday(profile.timeZone),
    );
    if (day?.suggestedComplexId) return day.suggestedComplexId;
    return (await this.programs.nextComplex(profile.userId))?.id ?? null;
  }

  private async view(
    profile: SportProfile,
    workout: WorkoutFull,
  ): Promise<WorkoutResponseDto> {
    const restBefore =
      workoutTiming(workout)?.restBefore ?? new Map<number, number>();
    const [limited, last] = await Promise.all([
      this.limitations.activeJointIds(profile),
      Promise.all(
        workout.exercises.map((item) =>
          this.workouts.lastResult(profile.userId, item.exerciseId),
        ),
      ),
    ]);
    return {
      id: workout.id,
      complexId: workout.complexId,
      complexName: workout.complexName,
      status: workout.status,
      date: isoDate(workout.date),
      startedAt: workout.startedAt,
      finishedAt: workout.finishedAt,
      cardioName: workout.cardioName,
      cardioMinutes: workout.cardioMinutes,
      warmupMinutes: workout.warmupMinutes,
      warmupFinishedAt: workout.warmupFinishedAt,
      exercises: workout.exercises.map((item, index) =>
        this.itemView(item, limited, last[index], restBefore),
      ),
      settings: {
        showRestTimer: profile.showRestTimer,
        restSeconds: profile.restSeconds,
        restAutoStart: profile.restAutoStart,
        timerSound: profile.timerSound,
        timerVibration: profile.timerVibration,
      },
    };
  }

  private itemView(
    item: WorkoutExerciseFull,
    limited: Set<number>,
    last: Awaited<ReturnType<WorkoutService['lastResult']>>,
    restBefore: Map<number, number>,
  ): WorkoutItemResponseDto {
    const { exercise } = item;
    return {
      id: item.id,
      exerciseId: item.exerciseId,
      name: exercise.name,
      muscles: primaryMuscles(exercise.muscles),
      imageUrl: this.uploads.toPublicUrl(exercise.imagePath),
      technique: exercise.technique,
      steps: exercise.steps,
      mistakes: exercise.mistakes,
      imageEndUrl: this.uploads.toPublicUrl(exercise.imageEndPath),
      imageCredit: imageCredit(exercise),
      videoUrl: exercise.videoUrl,
      bodyweight: exercise.equipment === 'BODYWEIGHT',
      measure: exercise.measure,
      draft: exercise.status === 'DRAFT',
      done: isDone(item),
      replaced: item.replacedExerciseId !== null,
      plannedSets: item.plannedSets,
      repsMin: item.repsMin,
      repsMax: item.repsMax,
      superset: item.superset,
      limitedZones: exercise.joints
        .filter((j) => limited.has(j.jointId))
        .map((j) => j.joint.name.toLowerCase()),
      sets: item.sets.map((s) => ({
        id: s.id,
        number: s.number,
        weight: Number(s.weight),
        reps: s.reps,
        clientId: s.clientId,
        doneAt: s.doneAt,
        workSeconds: s.workSeconds,
        restTargetSeconds: s.restTargetSeconds,
        restBeforeSeconds: restBefore.get(s.id) ?? null,
      })),
      last: last
        ? {
            date: isoDate(last.date),
            sets: last.sets,
          }
        : null,
    };
  }
}
