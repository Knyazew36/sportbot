import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from 'prisma/prisma.service';

import { APP_SCREEN, BotChannelKey, botAppLink, BotSender } from '@/bot';
import { Prisma, User } from '@/generated/prisma/client';
import { MessengerMessage } from '@/messengers';

import { SharedWorkoutResponseDto } from './dto/shared-workout.response.dto';
import { shareCardMessage } from './workout.texts';
import { isDone, WORKOUT_INCLUDE, workoutTotals } from './workout.service';

const SHARE_INCLUDE = {
  ...WORKOUT_INCLUDE,
  user: {
    select: {
      sportProfile: { select: { displayName: true, currentStreak: true } },
    },
  },
} satisfies Prisma.WorkoutInclude;

type SharedWorkout = Prisma.WorkoutGetPayload<{
  include: typeof SHARE_INCLUDE;
}>;

const authorOf = (workout: SharedWorkout) => ({
  name: workout.user.sportProfile?.displayName ?? 'Спортсмен',
  currentStreak: workout.user.sportProfile?.currentStreak ?? 0,
});

/** «Поделиться» результатом: карточка для пересылки и страница результата по токену. */
@Injectable()
export class WorkoutShareService {
  private readonly logger = new Logger(`🏋️ ${WorkoutShareService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sender: BotSender,
  ) {}

  // ── Карточка ────────────────────────────────────────────────────────────

  /** Карточка результата для пересылки; ссылка ведёт в мини-приложение бота этого мессенджера. */
  public async card(
    userId: number,
    workoutId: number,
    channel: BotChannelKey,
  ): Promise<MessengerMessage> {
    const workout = await this.shareable(userId, workoutId);
    const author = authorOf(workout);
    this.logger.log(
      `Карточка результата: workoutId=${workoutId}, userId=${userId}, ${channel}`,
    );
    return shareCardMessage({
      authorName: author.name,
      complexName: workout.complexName,
      totals: workoutTotals(workout),
      currentStreak: author.currentStreak,
      url: botAppLink(channel, APP_SCREEN.result(workout.shareToken)),
    });
  }

  /** Из приложения: бот присылает карточку в чат того мессенджера, откуда открыто приложение. */
  public async sendCard(
    user: User,
    workoutId: number,
    channel: BotChannelKey | null,
  ): Promise<void> {
    const via = channel ?? 'TELEGRAM';
    const card = await this.card(user.id, workoutId, via);
    try {
      await this.sender.sendVia(via, user, card);
    } catch (error) {
      this.logger.warn(
        `Карточка не доставлена: workoutId=${workoutId}, userId=${user.id}, ${via}: ${(error as Error).message}`,
      );
      throw new BadRequestException(
        'Не получилось написать в чат — открой бота и нажми «Старт», потом попробуй ещё раз.',
      );
    }
  }

  // ── Страница результата ─────────────────────────────────────────────────

  public async byToken(
    viewerId: number,
    shareToken: string,
  ): Promise<SharedWorkoutResponseDto> {
    const workout = await this.prisma.workout.findUnique({
      where: { shareToken },
      include: SHARE_INCLUDE,
    });
    // Токен выдаётся только законченной тренировке, но её могли удалить вместе с аккаунтом
    if (!workout) throw new NotFoundException('Ссылка устарела.');
    const author = authorOf(workout);
    this.logger.debug(
      `Просмотр результата: workoutId=${workout.id}, viewerId=${viewerId}`,
    );
    return {
      authorName: author.name,
      isOwn: workout.userId === viewerId,
      workoutId: workout.id,
      complexName: workout.complexName,
      date: workout.date.toISOString().slice(0, 10),
      ...workoutTotals(workout),
      currentStreak: author.currentStreak,
      cardioName: workout.cardioName,
      cardioMinutes: workout.cardioMinutes,
      exercises: workout.exercises.map((item) => ({
        name: item.exercise.name,
        done: isDone(item),
        sets: item.sets.map((s) => ({
          weight: Number(s.weight),
          reps: s.reps,
        })),
      })),
    };
  }

  // ── Токен ───────────────────────────────────────────────────────────────

  /**
   * Тренировка, готовая к шарингу: своя и законченная. Токен ставится при первом шаринге и потом
   * не меняется — уже разосланные ссылки продолжают работать.
   */
  private async shareable(
    userId: number,
    workoutId: number,
  ): Promise<SharedWorkout & { shareToken: string }> {
    const where = {
      id: workoutId,
      userId,
      status: { not: 'IN_PROGRESS' },
    } satisfies Prisma.WorkoutWhereInput;
    try {
      const workout = await this.prisma.workout.update({
        where: { ...where, AND: { shareToken: null } },
        data: { shareToken: randomBytes(8).toString('hex') },
        include: SHARE_INCLUDE,
      });
      this.logger.log(
        `Токен результата выдан: workoutId=${workoutId}, userId=${userId}`,
      );
      return workout as SharedWorkout & { shareToken: string };
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2025'
      )
        throw error;
    }
    // Токен уже был — или тренировки нет
    const workout = await this.prisma.workout.findFirst({
      where: { ...where, shareToken: { not: null } },
      include: SHARE_INCLUDE,
    });
    if (!workout)
      throw new NotFoundException('Тренировка не найдена или ещё идёт.');
    return workout as SharedWorkout & { shareToken: string };
  }
}
