import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'prisma/prisma.service';

import { APP_SCREEN, BotChannelKey, botAppLink, BotSender, cut } from '@/bot';
import { uploadRoot } from '@/catalog/catalog.service';
import { durationText, isTimed } from '@/catalog/measure';
import { Prisma, User } from '@/generated/prisma/client';
import { MessengerMessage } from '@/messengers';

import { SharedWorkoutResponseDto } from './dto/shared-workout.response.dto';
import { renderShareCard, ShareCardExercise } from './share-card';
import { shareCardMessage } from './workout.texts';
import {
  isDone,
  WORKOUT_INCLUDE,
  WorkoutExerciseFull,
  workoutTotals,
} from './workout.service';

/** Подпись к картинке в Telegram — не длиннее 1024 знаков; длинный список режем. */
const CAPTION_MAX = 1000;

const num = (value: number): string => String(Number(value.toFixed(2)));

/** Лучший подход для картинки: тяжелейший вес (при равном — больше повторов), без веса — больше повторов. */
const bestSet = (item: WorkoutExerciseFull): string | null => {
  if (!item.sets.length) return null;
  if (isTimed(item.exercise.measure))
    return durationText(Math.max(...item.sets.map((s) => s.reps)));
  const best = item.sets.reduce((a, b) => {
    const wa = Number(a.weight);
    const wb = Number(b.weight);
    return wb > wa || (wb === wa && b.reps > a.reps) ? b : a;
  });
  const weight = Number(best.weight);
  return weight ? `${num(weight)} × ${best.reps}` : `× ${best.reps}`;
};

const ddmmyyyy = (date: Date): string =>
  `${String(date.getUTCDate()).padStart(2, '0')}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${date.getUTCFullYear()}`;

const SHARE_INCLUDE = {
  ...WORKOUT_INCLUDE,
  user: {
    select: {
      sportProfile: {
        select: { displayName: true, currentStreak: true, gender: true },
      },
    },
  },
} satisfies Prisma.WorkoutInclude;

type SharedWorkout = Prisma.WorkoutGetPayload<{
  include: typeof SHARE_INCLUDE;
}>;

const authorOf = (workout: SharedWorkout) => ({
  name: workout.user.sportProfile?.displayName ?? 'Спортсмен',
  currentStreak: workout.user.sportProfile?.currentStreak ?? 0,
  gender: workout.user.sportProfile?.gender ?? null,
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

  /**
   * Карточка результата для пересылки: картинка-плакат и подробности подписью; ссылка ведёт
   * в мини-приложение бота этого мессенджера. Картинка живёт во временном файле только на время
   * отправки — send получает готовое сообщение, файл удаляется после него.
   */
  public async withCard<T>(
    userId: number,
    workoutId: number,
    channel: BotChannelKey,
    send: (card: MessengerMessage) => Promise<T>,
  ): Promise<T> {
    const workout = await this.shareable(userId, workoutId);
    const author = authorOf(workout);
    const totals = workoutTotals(workout);
    this.logger.log(
      `Карточка результата: workoutId=${workoutId}, userId=${userId}, ${channel}`,
    );
    const message = shareCardMessage({
      complexName: workout.complexName,
      exercises: workout.exercises,
      totals,
      cardioName: workout.cardioName,
      cardioMinutes: workout.cardioMinutes,
      url: botAppLink(channel, APP_SCREEN.result(workout.shareToken)),
    });
    const file = this.renderImage(workout, author, totals);
    try {
      return await send(
        file
          ? {
              ...message,
              text: cut(message.text, CAPTION_MAX),
              image: { path: file },
            }
          : message,
      );
    } finally {
      if (file) fs.rmSync(file, { force: true });
    }
  }

  /** Из приложения: бот присылает карточку в чат того мессенджера, откуда открыто приложение. */
  public async sendCard(
    user: User,
    workoutId: number,
    channel: BotChannelKey | null,
  ): Promise<void> {
    const via = channel ?? 'TELEGRAM';
    await this.withCard(user.id, workoutId, via, async (card) => {
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
    });
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
        measure: item.exercise.measure,
        done: isDone(item),
        sets: item.sets.map((s) => ({
          weight: Number(s.weight),
          reps: s.reps,
        })),
        superset: item.superset,
      })),
    };
  }

  // ── Картинка ────────────────────────────────────────────────────────────

  /**
   * Плакат результата во временный файл. Не получилось (нет шрифтов, сбой resvg) — карточка
   * уходит одним текстом: поделиться важнее, чем картинка.
   */
  private renderImage(
    workout: SharedWorkout,
    author: ReturnType<typeof authorOf>,
    totals: ReturnType<typeof workoutTotals>,
  ): string | null {
    try {
      const exercises: ShareCardExercise[] = workout.exercises
        .filter(isDone)
        .map((item) => ({
          name: item.exercise.name,
          sets: item.sets.length,
          best: bestSet(item),
          superset: item.superset,
        }));
      const png = renderShareCard({
        complexName: workout.complexName,
        date: ddmmyyyy(workout.date),
        minutes: totals.minutes,
        sets: totals.sets,
        tonnage: totals.tonnage,
        exercisesDone: totals.exercisesDone,
        exercises,
        palette: author.gender === 'FEMALE' ? 'rose' : 'classic',
      });
      const dir = path.join(uploadRoot(), 'tmp');
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `share-${workout.id}-${Date.now()}.png`);
      fs.writeFileSync(file, png);
      this.logger.debug(`Картинка результата готова: workoutId=${workout.id}`);
      return file;
    } catch (error) {
      this.logger.error(
        `Картинка результата не нарисовалась, шлём текстом: workoutId=${workout.id}`,
        (error as Error).stack,
      );
      return null;
    }
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
