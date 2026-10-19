import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { addDays, localToday, weekdayOf, weekStart } from '@/bot';
import { SportAccountService } from '@/bot/sport-account.service';
import { Pause, PlanDay, SportProfile } from '@/generated/prisma/client';
import { LimitationService } from '@/limitation/limitation.service';
import { PlanDayService } from '@/plan/plan-day.service';
import { PollService } from '@/plan/poll.service';
import { ComplexFull, ProgramService } from '@/program/program.service';
import { resolveWarmup } from '@/program/warmup';
import { isDone, WorkoutFull, WorkoutService } from '@/workout/workout.service';

import { DayComplexBriefResponseDto } from './dto/day-complex-brief.response.dto';
import { DayComplexResponseDto } from './dto/day-complex.response.dto';
import { DayEveningResponseDto } from './dto/day-evening.response.dto';
import { DayFixResponseDto } from './dto/day-fix.response.dto';
import { DayNextResponseDto } from './dto/day-next.response.dto';
import { DaySkipResponseDto } from './dto/day-skip.response.dto';
import { DayState, DayTodayResponseDto } from './dto/day-today.response.dto';
import {
  DayWeekCellResponseDto,
  WeekMark,
} from './dto/day-week-cell.response.dto';
import { DayWorkoutResponseDto } from './dto/day-workout.response.dto';

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

/** Насколько вперёд искать следующий тренировочный день: дальше — расписание фактически пустое. */
const NEXT_HORIZON_DAYS = 60;
const NEXT_STATES: DayState[] = ['DONE', 'REST', 'MISSED', 'PAUSE'];

/** Экран «Сегодня» Mini App: состояние дня и ответы, которые в боте даются кнопками опроса. */
@Injectable()
export class DayService {
  private readonly logger = new Logger(`🗓 ${DayService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: SportAccountService,
    private readonly planDays: PlanDayService,
    private readonly polls: PollService,
    private readonly programs: ProgramService,
    private readonly workouts: WorkoutService,
    private readonly limitations: LimitationService,
  ) {}

  // ── Сегодня ─────────────────────────────────────────────────────────────

  /**
   * Одно из состояний дня (frontend-tz, 7). complexId — «другой комплекс» до начала тренировки:
   * любой комплекс активной программы вместо предложенного по очереди.
   */
  public async today(
    userId: number,
    complexId?: number,
  ): Promise<DayTodayResponseDto> {
    const before = await this.accounts.profile(userId);
    const today = localToday(before.timeZone);
    // Зависшие тренировки прошлых дней закрываются, как при «тренировка сегодня» в боте
    await this.workouts.autoCloseStale(before, today);
    const profile = await this.accounts.profile(userId);

    const [
      current,
      finished,
      day,
      pause,
      complexes,
      next,
      weekDays,
      aheadDays,
      workoutsToday,
    ] = await Promise.all([
        this.workouts.current(userId),
        this.workouts.finishedOn(userId, today),
        this.planDays.find(userId, today),
        this.planDays.activePause(userId, today),
        this.programs.activeComplexes(userId),
        this.programs.nextComplex(userId),
        this.prisma.planDay.findMany({
          where: {
            userId,
            date: { gte: weekStart(today), lt: addDays(weekStart(today), 7) },
          },
        }),
        this.prisma.planDay.findMany({
          where: {
            userId,
            date: { gt: today, lte: addDays(today, NEXT_HORIZON_DAYS) },
          },
          select: { date: true, status: true },
        }),
        this.prisma.workout.count({
          where: {
            userId,
            date: today,
            status: { in: ['FINISHED', 'AUTO_CLOSED'] },
          },
        }),
      ]);

    const isTrainingDay = profile.trainingDays.includes(weekdayOf(today));
    const state = this.stateOf(profile, {
      current: !!current,
      finished: !!finished || day?.status === 'DONE',
      paused: !!pause,
      day,
      hasProgram: complexes.length > 0,
      isTrainingDay,
    });

    const showComplex = state === 'TRAINING' || state === 'REST';
    const complex = showComplex
      ? await this.complexOfDay(profile, {
          requested: complexId,
          suggested: day?.suggestedComplexId ?? null,
          allowed: complexes.map((c) => c.id),
          nextId: next?.id ?? null,
        })
      : null;

    const workout =
      state === 'IN_PROGRESS' && current
        ? this.workoutBrief(current)
        : state === 'DONE'
          ? await this.finishedBrief(userId, finished?.id ?? day?.workoutId)
          : null;

    const program = profile.activeProgramId
      ? await this.prisma.program.findUnique({
          where: { id: profile.activeProgramId },
          select: { name: true },
        })
      : null;

    this.logger.debug(
      `Сегодня: userId=${userId}, ${isoDate(today)}, ${state}${complex ? `, complexId=${complex.id}` : ''}`,
    );

    return {
      state,
      date: isoDate(today),
      dayId: day?.id ?? null,
      streak: { current: profile.currentStreak, best: profile.bestStreak },
      week: this.week(profile, today, weekDays, pause),
      programName: program?.name ?? null,
      complexes: complexes.map((c): DayComplexBriefResponseDto => ({
        id: c.id,
        name: c.name,
        exerciseCount: c._count.exercises,
        isNext: c.id === next?.id,
      })),
      complex,
      workout,
      workoutsToday,
      next:
        next && NEXT_STATES.includes(state)
          ? {
              date: this.nextTrainingDate(profile, today, aheadDays, pause),
              complexId: next.id,
              complexName: next.name,
              exerciseCount: next.exercises.length,
            }
          : null,
      pause: pause
        ? {
            endDate: pause.endDate ? isoDate(pause.endDate) : null,
            expired: !!pause.endDate && pause.endDate < today,
          }
        : null,
      rescheduleOffered: day?.status === 'MISSED' && !!day.rescheduleOfferedAt,
      eveningAsked:
        day?.status === 'PENDING' && !!day.eveningAskedAt && !day.eveningAnswer,
    };
  }

  // ── Ответы ──────────────────────────────────────────────────────────────

  /** «Сегодня не буду»: пропуск и что предложить дальше. */
  public async skip(userId: number): Promise<DaySkipResponseDto> {
    const profile = await this.accounts.profile(userId);
    const outcome = await this.polls.skipToday(profile);
    return {
      canReschedule: outcome.canReschedule,
      suggestPause: outcome.suggestPause,
    };
  }

  /** Вечерний ответ «потренировался?» из приложения. */
  public async evening(
    userId: number,
    yes: boolean,
  ): Promise<DayEveningResponseDto> {
    const profile = await this.accounts.profile(userId);
    const outcome = await this.polls.answerEveningToday(profile, yes);
    const fresh = await this.accounts.profile(userId);
    return {
      done: !!outcome.done,
      currentStreak: outcome.done?.currentStreak ?? fresh.currentStreak,
      canReschedule: outcome.missed?.canReschedule ?? false,
      suggestPause: outcome.missed?.suggestPause ?? false,
    };
  }

  /** Ответ на «напомнить завтра?» после пропуска сегодняшнего дня. */
  public async reschedule(userId: number, accept: boolean): Promise<void> {
    const profile = await this.accounts.profile(userId);
    const day = await this.planDays.find(userId, localToday(profile.timeZone));
    if (!day?.rescheduleOfferedAt)
      throw new BadRequestException('Перенос уже не предлагается.');
    if (accept) await this.polls.reschedule(profile, day.id);
    else await this.polls.declineReschedule(profile, day.id);
  }

  /** Исправление отметки дня в пределах 7 дней (business-tz, 8.3 и 25.9). */
  public async fix(
    userId: number,
    dayId: number,
    status: 'DONE' | 'MISSED',
  ): Promise<DayFixResponseDto> {
    const profile = await this.accounts.profile(userId);
    if (status === 'DONE') {
      const result = await this.polls.fixToDone(profile, dayId);
      return { currentStreak: result.currentStreak };
    }
    await this.polls.fixToMissed(profile, dayId);
    const fresh = await this.accounts.profile(userId);
    return { currentStreak: fresh.currentStreak };
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private stateOf(
    profile: SportProfile,
    facts: {
      current: boolean;
      finished: boolean;
      paused: boolean;
      day: PlanDay | null;
      hasProgram: boolean;
      isTrainingDay: boolean;
    },
  ): DayState {
    if (!profile.onboardedAt) return 'ONBOARDING';
    // Начатая тренировка важнее паузы и расписания: её можно продолжить в любой день
    if (facts.current) return 'IN_PROGRESS';
    if (facts.finished) return 'DONE';
    if (facts.paused) return 'PAUSE';
    if (facts.day?.status === 'MISSED') return 'MISSED';
    if (!facts.hasProgram) return 'NO_PROGRAM';
    // Разовый перенесённый день тоже ждёт тренировки, хоть и не по расписанию
    if (facts.day?.status === 'PENDING' || facts.isTrainingDay)
      return 'TRAINING';
    return 'REST';
  }

  private async complexOfDay(
    profile: SportProfile,
    pick: {
      requested?: number;
      suggested: number | null;
      allowed: number[];
      nextId: number | null;
    },
  ): Promise<DayComplexResponseDto | null> {
    const id = [pick.requested, pick.suggested, pick.nextId].find(
      (candidate): candidate is number =>
        candidate != null && pick.allowed.includes(candidate),
    );
    if (!id) return null;
    const [complex, limited] = await Promise.all([
      this.programs.findComplex(profile.userId, id),
      this.limitations.activeJointIds(profile),
    ]);
    return this.complexView(complex, profile, limited, id === pick.nextId);
  }

  private complexView(
    complex: ComplexFull,
    profile: SportProfile,
    limited: Set<number>,
    byQueue: boolean,
  ): DayComplexResponseDto {
    return {
      id: complex.id,
      name: complex.name,
      byQueue,
      cardioName: complex.cardioName,
      cardioMinutes: complex.cardioMinutes,
      warmupMinutes: resolveWarmup(complex, profile),
      exercises: complex.exercises.map((item) => ({
        id: item.id,
        exerciseId: item.exerciseId,
        name: item.exercise.name,
        muscles: item.exercise.muscles
          .filter((m) => m.role === 'PRIMARY')
          .map((m) => m.muscle.name)
          .join(' · '),
        sets: item.sets,
        repsMin: item.repsMin,
        repsMax: item.repsMax,
        measure: item.exercise.measure,
        superset: item.superset,
        limitedZones: item.exercise.joints
          .filter((j) => limited.has(j.jointId))
          .map((j) => j.joint.name.toLowerCase()),
      })),
    };
  }

  private workoutBrief(workout: WorkoutFull): DayWorkoutResponseDto {
    return {
      id: workout.id,
      complexName: workout.complexName,
      done: workout.exercises.filter(isDone).length,
      total: workout.exercises.length,
    };
  }

  private async finishedBrief(
    userId: number,
    workoutId: number | null | undefined,
  ): Promise<DayWorkoutResponseDto | null> {
    if (!workoutId) return null;
    const workout = await this.workouts
      .find(userId, workoutId)
      .catch(() => null);
    return workout ? this.workoutBrief(workout) : null;
  }

  /**
   * Ближайший день после сегодня, когда ждём тренировку: перенесённый (PENDING) или по расписанию,
   * если он не на паузе и не закрыт заранее — внеплановая тренировка засчитывает ближайший будущий день.
   */
  private nextTrainingDate(
    profile: SportProfile,
    today: Date,
    ahead: Pick<PlanDay, 'date' | 'status'>[],
    pause: Pause | null,
  ): DayNextResponseDto['date'] {
    if (pause && !pause.endDate) return null;
    for (let offset = 1; offset <= NEXT_HORIZON_DAYS; offset++) {
      const date = addDays(today, offset);
      const day = ahead.find((d) => d.date.getTime() === date.getTime());
      if (day?.status === 'PENDING') return isoDate(date);
      if (day) continue;
      const paused = !!pause?.endDate && date <= pause.endDate;
      if (!paused && profile.trainingDays.includes(weekdayOf(date)))
        return isoDate(date);
    }
    return null;
  }

  /** Неделя с понедельника: отметки дней плана, впереди — тренировочные дни и пауза. */
  private week(
    profile: SportProfile,
    today: Date,
    days: PlanDay[],
    pause: Pause | null,
  ): DayWeekCellResponseDto[] {
    const monday = weekStart(today);
    return Array.from({ length: 7 }, (_, offset) => {
      const date = addDays(monday, offset);
      const day = days.find((d) => d.date.getTime() === date.getTime());
      return {
        date: isoDate(date),
        weekday: weekdayOf(date),
        mark: this.markOf(profile, date, today, day, pause),
        isToday: date.getTime() === today.getTime(),
      };
    });
  }

  private markOf(
    profile: SportProfile,
    date: Date,
    today: Date,
    day: PlanDay | undefined,
    pause: Pause | null,
  ): WeekMark {
    if (day?.status === 'DONE') return 'DONE';
    if (day?.status === 'MISSED') return 'MISSED';
    if (day?.status === 'PAUSED') return 'PAUSED';
    const inPause =
      !!pause &&
      date >= today &&
      date >= pause.startDate &&
      (!pause.endDate || date <= pause.endDate);
    if (inPause) return 'PAUSED';
    // Прошедший день без отметки — вопрос не задавался (например, до настройки)
    if (date < today && !day) return 'REST';
    if (day?.status === 'PENDING') return 'PLAN';
    return profile.trainingDays.includes(weekdayOf(date)) ? 'PLAN' : 'REST';
  }
}
