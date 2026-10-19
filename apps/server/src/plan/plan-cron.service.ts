import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'prisma/prisma.service';

import {
  addDays,
  BotSender,
  diffDays,
  hhmmToMinutes,
  localMinutes,
  localToday,
  weekdayOf,
  weekStart,
} from '@/bot';
import {
  BodyWeightService,
  WEIGHT_ASK_PERIOD_DAYS,
} from '@/body-weight/body-weight.service';
import { SportProfile, User } from '@/generated/prisma/client';
import { PauseService } from '@/pause/pause.service';
import { ProgramService } from '@/program/program.service';
import { StatsService } from '@/stats/stats.service';
import { finishedMessage } from '@/workout/workout.texts';
import { isDone, WorkoutService } from '@/workout/workout.service';

import { PlanDayService } from './plan-day.service';
import { PollService } from './poll.service';

/** Ключ advisory-lock Postgres для тика крона: два тика не накладываются. */
const CRON_LOCK_KEY = 20261011;
const REMIND_AFTER_MS = 2 * 60 * 60 * 1000;
/** Личная сводка — в воскресенье в 20:00 по времени пользователя. */
const SUMMARY_MINUTES = 20 * 60;

type ProfileWithUser = SportProfile & { user: User };

/**
 * Один тик раз в минуту. Каждый шаг выбирает кандидатов условием «время пришло и отметка ещё
 * пустая», поэтому простой сервера ничего не теряет: пропущенное досылается на следующем тике,
 * а перезапуск не даёт повторных вопросов (раздел 25.2 ТЗ).
 */
@Injectable()
export class PlanCronService {
  private readonly logger = new Logger(`⏰ ${PlanCronService.name}`);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sender: BotSender,
    private readonly planDays: PlanDayService,
    private readonly polls: PollService,
    private readonly workouts: WorkoutService,
    private readonly programs: ProgramService,
    private readonly pauses: PauseService,
    private readonly weights: BodyWeightService,
    private readonly stats: StatsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  public async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      // Блокировка на транзакцию: снимается сама, даже если процесс упадёт посреди тика
      await this.prisma.$transaction(
        async (tx) => {
          const [{ locked }] = await tx.$queryRaw<
            { locked: boolean }[]
          >`SELECT pg_try_advisory_xact_lock(${CRON_LOCK_KEY}) AS locked`;
          if (!locked) {
            this.logger.debug('Тик пропущен: блокировку держит другой процесс');
            return;
          }
          await this.run(new Date());
        },
        { timeout: 55_000, maxWait: 5_000 },
      );
    } catch (error) {
      this.logger.error('Тик крона упал', (error as Error).stack);
    } finally {
      this.running = false;
    }
  }

  // ── Тик ─────────────────────────────────────────────────────────────────

  private async run(now: Date): Promise<void> {
    const [profiles, blocked] = await Promise.all([
      this.prisma.sportProfile.findMany({
        where: { onboardedAt: { not: null } },
        include: { user: true },
      }),
      this.prisma.blockedAccount.findMany({
        select: { channel: true, externalId: true },
      }),
    ]);
    const blockedKeys = new Set(
      blocked.map((b) => `${b.channel}:${b.externalId}`),
    );
    let actions = 0;
    for (const profile of profiles) {
      const { user } = profile;
      if (
        blockedKeys.has(`TELEGRAM:${user.telegramId}`) ||
        blockedKeys.has(`MAX:${user.maxId}`)
      )
        continue;
      try {
        actions += await this.tickUser(profile, now);
      } catch (error) {
        this.logger.error(
          `Шаги крона упали: userId=${profile.userId}`,
          (error as Error).stack,
        );
      }
    }
    if (actions)
      this.logger.log(
        `Тик: действий — ${actions}, пользователей — ${profiles.length}`,
      );
  }

  private async tickUser(profile: ProfileWithUser, now: Date): Promise<number> {
    const { user, userId, timeZone } = profile;
    const today = localToday(timeZone, now);
    const yesterday = addDays(today, -1);
    const minutes = localMinutes(timeZone, now);
    const morning = hhmmToMinutes(profile.morningTime);
    const evening = hhmmToMinutes(profile.eveningTime);
    let actions = 0;

    // Закрытие дня: незавершённые тренировки прошлых дат
    for (const result of await this.workouts.autoCloseStale(profile, today)) {
      await this.sender.send(user, finishedMessage(result));
      actions++;
    }

    // Пропуск — тренировочный день без тренировки, вопросы тут ни при чём. Сутки после дня
    // оставлены, чтобы успеть отметить вчерашнюю тренировку
    const overdue = await this.prisma.planDay.findMany({
      where: { userId, status: 'PENDING', date: { lt: yesterday } },
      select: { id: true },
    });
    for (const day of overdue) {
      const result = await this.planDays.markMissed(userId, day.id);
      // Предложение паузы — тоже вопрос: кто их выключил, тому бот сам не пишет
      if (result.suggestPause && profile.questionsEnabled)
        await this.sender.send(user, this.pauses.offerMessage());
      this.logger.log(
        `Просроченный день → MISSED: planDayId=${day.id}, userId=${userId}`,
      );
      actions++;
    }

    // На паузе бот не задаёт вопросов; по окончании срока — спрашивает, а не возобновляет молча
    const pause = await this.planDays.activePause(userId, today);
    if (pause) {
      if (pause.endDate && pause.endDate < today && !pause.endAskedAt) {
        if (await this.pauses.markEndAsked(pause.id)) {
          await this.sender.send(user, this.pauses.endedMessage());
          this.logger.log(
            `Пауза закончилась, задан вопрос: pauseId=${pause.id}, userId=${userId}`,
          );
          actions++;
        }
      }
      return actions;
    }

    // День плана не зависит от вопросов: по нему считается пропуск, а вопросы — только стимул
    actions += await this.trainingDayStep(profile, today);
    if (profile.questionsEnabled) {
      actions += await this.morningStep(
        profile,
        today,
        minutes,
        morning,
        evening,
        now,
      );
      actions += await this.eveningStep(profile, today, minutes, evening);
    }

    // Напоминание наутро: вчера вечером вопрос задан, ответа нет
    if (
      profile.questionsEnabled &&
      profile.remindersEnabled &&
      minutes >= morning
    ) {
      const { count } = await this.prisma.planDay.updateMany({
        where: {
          userId,
          date: yesterday,
          status: 'PENDING',
          eveningAskedAt: { not: null },
          eveningAnswer: null,
          eveningRemindedAt: null,
        },
        data: { eveningRemindedAt: now },
      });
      if (count) {
        const day = await this.planDays.find(userId, yesterday);
        if (day)
          await this.sender.send(user, this.polls.eveningMessage(day.id, true));
        this.logger.log(`Напоминание наутро: userId=${userId}`);
        actions++;
      }
    }

    // Вопрос о весе тела
    const period = WEIGHT_ASK_PERIOD_DAYS[profile.weightAskFrequency];
    if (
      Number.isFinite(period) &&
      minutes >= morning &&
      (!profile.weightAskedOn ||
        diffDays(today, profile.weightAskedOn) >= period)
    ) {
      if (await this.weights.markAsked(user, profile, today)) {
        await this.sender.send(user, this.weights.askMessage());
        actions++;
      }
    }

    // Личная сводка: воскресенье вечером, один раз за неделю
    const monday = weekStart(today);
    if (
      weekdayOf(today) === 0 &&
      minutes >= SUMMARY_MINUTES &&
      profile.weeklySummarySentOn?.getTime() !== monday.getTime()
    ) {
      const { count } = await this.prisma.sportProfile.updateMany({
        where: {
          userId,
          OR: [
            { weeklySummarySentOn: null },
            { weeklySummarySentOn: { not: monday } },
          ],
        },
        data: { weeklySummarySentOn: monday },
      });
      if (count) {
        await this.sender.send(user, await this.stats.weeklySummary(profile));
        this.logger.log(`Недельная сводка отправлена: userId=${userId}`);
        actions++;
      }
    }
    return actions;
  }

  // ── Шаги ────────────────────────────────────────────────────────────────

  private async morningStep(
    profile: ProfileWithUser,
    today: Date,
    minutes: number,
    morning: number,
    evening: number,
    now: Date,
  ): Promise<number> {
    const { user, userId } = profile;
    if (minutes < morning) return 0;
    let day = await this.planDays.find(userId, today);
    const isTrainingDay = profile.trainingDays.includes(weekdayOf(today));
    if (!day && !isTrainingDay) return 0;
    day ??= await this.prisma.planDay.upsert({
      where: { userId_date: { userId, date: today } },
      update: {},
      create: { userId, date: today },
    });
    if (day.status !== 'PENDING') return 0;

    if (!day.morningAskedAt) {
      // Комплекс могли выбрать в приложении ещё до утра — бот называет его, а не очередной
      const complex = day.suggestedComplexId
        ? await this.prisma.complex.findUnique({
            where: { id: day.suggestedComplexId },
            select: { id: true, name: true },
          })
        : await this.programs.nextComplex(userId);
      // Первый запуск закончен сегодня уже после утреннего времени: вопрос и его повтор
      // не шлём — экран «настройка закончена» сам предлагает тренировку. Вечерний остаётся.
      const { onboardedAt, timeZone } = profile;
      const setupAfterMorning =
        !!onboardedAt &&
        localToday(timeZone, onboardedAt).getTime() === today.getTime() &&
        localMinutes(timeZone, onboardedAt) >= morning;
      const { count } = await this.prisma.planDay.updateMany({
        where: { id: day.id, status: 'PENDING', morningAskedAt: null },
        data: {
          morningAskedAt: now,
          ...(setupAfterMorning && { morningRemindedAt: now }),
          suggestedComplexId: day.suggestedComplexId ?? complex?.id ?? null,
        },
      });
      if (!count) return 0;
      // Сервер простоял до вечера или тренировка уже идёт — утренний вопрос неуместен
      const started = await this.workouts.current(userId);
      if (minutes >= evening || started || setupAfterMorning) return 0;
      await this.sender.send(
        user,
        this.polls.morningMessage(day.id, complex?.name ?? null, false),
      );
      this.logger.log(`Утренний вопрос: planDayId=${day.id}, userId=${userId}`);
      return 1;
    }

    // Одно повторное напоминание через 2 часа, в тот же день
    if (
      profile.remindersEnabled &&
      !day.morningAnswer &&
      !day.morningRemindedAt &&
      minutes < evening &&
      now.getTime() - day.morningAskedAt.getTime() >= REMIND_AFTER_MS
    ) {
      const { count } = await this.prisma.planDay.updateMany({
        where: {
          id: day.id,
          status: 'PENDING',
          morningAnswer: null,
          morningRemindedAt: null,
        },
        data: { morningRemindedAt: now },
      });
      if (!count || (await this.workouts.current(userId))) return 0;
      await this.sender.send(
        user,
        this.polls.morningMessage(day.id, null, true),
      );
      this.logger.log(
        `Повтор утреннего вопроса: planDayId=${day.id}, userId=${userId}`,
      );
      return 1;
    }
    return 0;
  }

  /**
   * Тренировочный день заводится с начала суток, молча. Тренировка (из приложения или ответом
   * «да» на вечерний вопрос) закроет его, без неё он станет пропуском.
   */
  private async trainingDayStep(
    profile: ProfileWithUser,
    today: Date,
  ): Promise<number> {
    const { userId } = profile;
    if (!profile.trainingDays.includes(weekdayOf(today))) return 0;
    // createMany со skipDuplicates не трогает уже заведённый день: тренировка могла его закрыть
    const { count } = await this.prisma.planDay.createMany({
      data: { userId, date: today },
      skipDuplicates: true,
    });
    if (!count) return 0;
    this.logger.log(`Тренировочный день заведён: userId=${userId}`);
    return 1;
  }

  private async eveningStep(
    profile: ProfileWithUser,
    today: Date,
    minutes: number,
    evening: number,
  ): Promise<number> {
    const { user, userId } = profile;
    if (minutes < evening) return 0;
    const { count } = await this.prisma.planDay.updateMany({
      where: { userId, date: today, status: 'PENDING', eveningAskedAt: null },
      data: { eveningAskedAt: new Date() },
    });
    if (!count) return 0;
    const day = await this.planDays.find(userId, today);
    if (!day) return 0;
    const workout = await this.workouts.current(userId);
    // Детальная тренировка начата — спрашиваем, закончена ли; иначе — была ли вообще
    const message =
      workout?.mode === 'DETAILED'
        ? this.polls.unfinishedMessage({
            id: workout.id,
            complexName: workout.complexName,
            done: workout.exercises.filter(isDone).length,
            total: workout.exercises.length,
          })
        : this.polls.eveningMessage(day.id);
    await this.sender.send(user, message);
    this.logger.log(`Вечерний вопрос: planDayId=${day.id}, userId=${userId}`);
    return 1;
  }
}
