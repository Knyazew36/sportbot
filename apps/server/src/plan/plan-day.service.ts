import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { addDays, weekdayOf, weekStart } from '@/bot';
import { Pause, PlanDay, Prisma } from '@/generated/prisma/client';

type Tx = Prisma.TransactionClient;

/** После стольких пропусков подряд бот один раз предлагает паузу. */
const MISSES_FOR_PAUSE_OFFER = 3;

export interface MissResult {
  /** false — день уже не ждал ответа (двойное нажатие, старая кнопка). */
  changed: boolean;
  /** Набралось три пропуска подряд — пора предложить паузу. */
  suggestPause: boolean;
  /** Пропуск разового перенесённого дня: перенос повторно не предлагается. */
  wasRescheduled: boolean;
}

/**
 * Дни плана и серия. Нижний слой без зависимостей от тренировок и опросов — на него опираются
 * и те, и другие.
 */
@Injectable()
export class PlanDayService {
  private readonly logger = new Logger(`🗓 ${PlanDayService.name}`);

  constructor(private readonly prisma: PrismaService) {}

  // ── Чтение ──────────────────────────────────────────────────────────────

  public async find(userId: number, date: Date): Promise<PlanDay | null> {
    return this.prisma.planDay.findUnique({
      where: { userId_date: { userId, date } },
    });
  }

  /** Действующая пауза: снимается только явно — по окончании срока бот спрашивает, а не возобновляет молча. */
  public async activePause(userId: number, today: Date): Promise<Pause | null> {
    return this.prisma.pause.findFirst({
      where: { userId, endedAt: null, startDate: { lte: today } },
      orderBy: { id: 'desc' },
    });
  }

  // ── Смена статуса ───────────────────────────────────────────────────────

  /**
   * Пропуск дня. Меняет только день в PENDING — повторное нажатие ничего не делает.
   * Разовый перенесённый день не становится вторым пропуском: исходный пропуск уже записан.
   */
  public async markMissed(userId: number, dayId: number): Promise<MissResult> {
    const day = await this.prisma.planDay.findFirst({
      where: { id: dayId, userId, status: 'PENDING' },
      select: { id: true, type: true },
    });
    if (!day)
      return { changed: false, suggestPause: false, wasRescheduled: false };

    if (day.type === 'RESCHEDULED') {
      await this.prisma.planDay.deleteMany({
        where: { id: dayId, status: 'PENDING' },
      });
      this.logger.log(
        `Перенесённый день не состоялся и снят: planDayId=${dayId}, userId=${userId}`,
      );
      return { changed: true, suggestPause: false, wasRescheduled: true };
    }

    const { count } = await this.prisma.planDay.updateMany({
      where: { id: dayId, userId, status: 'PENDING' },
      data: { status: 'MISSED' },
    });
    if (!count)
      return { changed: false, suggestPause: false, wasRescheduled: false };

    const profile = await this.prisma.sportProfile.update({
      where: { userId },
      data: { missedInRow: { increment: 1 } },
      select: { missedInRow: true },
    });
    const suggestPause = profile.missedInRow >= MISSES_FOR_PAUSE_OFFER;
    if (suggestPause)
      await this.prisma.sportProfile.update({
        where: { userId },
        data: { missedInRow: 0 },
      });
    await this.recalcStreak(userId);
    this.logger.log(
      `День → MISSED: planDayId=${dayId}, userId=${userId}, подряд=${profile.missedInRow}`,
    );
    return { changed: true, suggestPause, wasRescheduled: false };
  }

  /**
   * Привязать засчитанную тренировку к дню плана (раздел 25.4 ТЗ).
   * @returns true — тренировка внеплановая (закрыла не свой день).
   */
  public async bindWorkout(
    tx: Tx,
    userId: number,
    workout: { id: number; date: Date },
    trainingDays: number[],
    forDayId?: number,
  ): Promise<boolean> {
    // Исправление отметки: день указан явно
    if (forDayId) {
      await tx.planDay.updateMany({
        where: { id: forDayId, userId },
        data: { status: 'DONE', workoutId: workout.id },
      });
      return false;
    }

    const own = await tx.planDay.findUnique({
      where: { userId_date: { userId, date: workout.date } },
    });
    if (own?.status === 'PENDING') {
      if (own.type === 'RESCHEDULED') {
        // Перенесённая тренировка закрывает пропущенный день, а не становится отдельным плановым
        const missed = await tx.planDay.findFirst({
          where: {
            userId,
            status: 'MISSED',
            workoutId: null,
            date: { gte: addDays(workout.date, -7), lt: workout.date },
          },
          orderBy: { date: 'desc' },
        });
        if (missed) {
          await tx.planDay.delete({ where: { id: own.id } });
          await tx.planDay.update({
            where: { id: missed.id },
            data: { status: 'DONE', workoutId: workout.id },
          });
          this.logger.log(
            `Перенос закрыл пропуск: planDayId=${missed.id}, workoutId=${workout.id}`,
          );
          return false;
        }
      }
      await tx.planDay.update({
        where: { id: own.id },
        data: { status: 'DONE', workoutId: workout.id },
      });
      this.logger.log(
        `День → DONE: planDayId=${own.id}, workoutId=${workout.id}`,
      );
      return false;
    }

    // Утром ответил «нет», а потом всё же потренировался — закрывается свой же день
    if (own?.status === 'MISSED' && !own.workoutId) {
      await tx.planDay.update({
        where: { id: own.id },
        data: { status: 'DONE', workoutId: workout.id },
      });
      this.logger.log(
        `Пропуск дня закрыт тренировкой: planDayId=${own.id}, workoutId=${workout.id}`,
      );
      return false;
    }
    // Тренировочный день, до утреннего вопроса: день плана ещё не создан кроном — создаём сами
    if (!own && trainingDays.includes(weekdayOf(workout.date))) {
      const day = await tx.planDay.create({
        data: {
          userId,
          date: workout.date,
          status: 'DONE',
          workoutId: workout.id,
        },
      });
      this.logger.log(
        `День → DONE (создан тренировкой): planDayId=${day.id}, workoutId=${workout.id}`,
      );
      return false;
    }

    // Внеплановая: закрывает самый ранний пропуск текущей недели
    const monday = weekStart(workout.date);
    const missed = await tx.planDay.findFirst({
      where: {
        userId,
        status: 'MISSED',
        workoutId: null,
        date: { gte: monday, lt: addDays(monday, 7) },
      },
      orderBy: { date: 'asc' },
    });
    if (missed) {
      await tx.planDay.update({
        where: { id: missed.id },
        data: { status: 'DONE', workoutId: workout.id },
      });
      this.logger.log(
        `Внеплановая закрыла пропуск: planDayId=${missed.id}, workoutId=${workout.id}`,
      );
      return true;
    }

    // Пропусков нет — закрывает ближайший будущий тренировочный день (крон его не опрашивает)
    for (let offset = 1; offset <= 14 && trainingDays.length; offset++) {
      const date = addDays(workout.date, offset);
      if (!trainingDays.includes(weekdayOf(date))) continue;
      const existing = await tx.planDay.findUnique({
        where: { userId_date: { userId, date } },
      });
      if (existing && existing.status !== 'PENDING') continue;
      const day = existing
        ? await tx.planDay.update({
            where: { id: existing.id },
            data: { status: 'DONE', workoutId: workout.id },
          })
        : await tx.planDay.create({
            data: { userId, date, status: 'DONE', workoutId: workout.id },
          });
      this.logger.log(
        `Внеплановая закрыла будущий день: planDayId=${day.id}, workoutId=${workout.id}`,
      );
      break;
    }
    return true;
  }

  // ── Серия ───────────────────────────────────────────────────────────────

  /**
   * Серия по дням плана в порядке дат: DONE увеличивает, MISSED обнуляет, PAUSED и PENDING
   * пропускаются. Рекорд — по всей истории: исправление старой отметки может его изменить.
   */
  public async recalcStreak(
    userId: number,
    tx: Tx = this.prisma,
  ): Promise<{ currentStreak: number; bestStreak: number }> {
    const days = await tx.planDay.findMany({
      where: { userId, status: { in: ['DONE', 'MISSED'] } },
      orderBy: { date: 'asc' },
      select: { status: true },
    });
    let currentStreak = 0;
    let bestStreak = 0;
    for (const day of days) {
      currentStreak = day.status === 'DONE' ? currentStreak + 1 : 0;
      bestStreak = Math.max(bestStreak, currentStreak);
    }
    await tx.sportProfile.update({
      where: { userId },
      data: { currentStreak, bestStreak },
    });
    return { currentStreak, bestStreak };
  }
}
