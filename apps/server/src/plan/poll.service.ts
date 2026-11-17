import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import {
  addDays,
  APP_SCREEN,
  appBtn,
  btn,
  localToday,
  msg,
  weekdayOf,
} from '@/bot';
import { PlanDay, PollAnswer, SportProfile } from '@/generated/prisma/client';
import { MessengerMessage } from '@/messengers';
import { PauseService } from '@/pause/pause.service';
import { CompleteResult, WorkoutService } from '@/workout/workout.service';

import { PlanDayService } from './plan-day.service';

/** Отметку за день можно исправить в течение 7 дней. */
export const FIX_WINDOW_DAYS = 7;

const pick = <T>(variants: T[], seed: number): T =>
  variants[Math.abs(seed) % variants.length];

const pluralExercises = (n: number): string => {
  const last = n % 10;
  if (n % 100 >= 11 && n % 100 <= 14) return 'упражнений';
  if (last === 1) return 'упражнение';
  if (last >= 2 && last <= 4) return 'упражнения';
  return 'упражнений';
};

/** Итог пропуска дня: что предложить пользователю дальше. */
export interface MissOutcome {
  /** Серию спасла заморозка. */
  streakSaved?: boolean;
  /** false — день уже не ждал ответа (двойное нажатие, старая кнопка). */
  changed: boolean;
  /** Предложить «напомнить завтра». */
  canReschedule: boolean;
  /** Три пропуска подряд — предложить паузу. */
  suggestPause: boolean;
}

/** Итог вечернего ответа из приложения. */
export interface EveningOutcome {
  done: CompleteResult | null;
  missed: MissOutcome | null;
}

/** Ответы на опросы, пропуск с переносом, исправление отметок. */
@Injectable()
export class PollService {
  private readonly logger = new Logger(`❓ ${PollService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly planDays: PlanDayService,
    private readonly workouts: WorkoutService,
    private readonly pauses: PauseService,
  ) {}

  // ── Вопросы ─────────────────────────────────────────────────────────────

  public morningMessage(
    dayId: number,
    complexName: string | null,
    reminder: boolean,
    exerciseCount: number | null = null,
  ): MessengerMessage {
    const buttons = [
      [
        btn('💪 Иду', `pd:am:${dayId}:y`),
        btn('😴 Не сегодня', `pd:am:${dayId}:n`),
      ],
      [appBtn(APP_SCREEN.today)],
    ];
    // Тексты чередуются по дню: одна и та же фраза каждое утро превращается в шум
    if (reminder)
      return msg(
        pick(
          [
            'Напоминаю про сегодняшнюю тренировку. Получится?',
            'Окно для тренировки ещё открыто. Идёшь?',
            'Как с тренировкой сегодня? Хватит и короткой.',
          ],
          dayId,
        ),
        buttons,
      );
    const plan = complexName
      ? `Сегодня по очереди «${complexName}»${exerciseCount ? `: ${exerciseCount} ${pluralExercises(exerciseCount)}` : ''}.`
      : null;
    return msg(
      [
        pick(
          [
            'Доброе утро. Сегодня тренировочный день.',
            'Утро! По расписанию сегодня тренировка.',
            'Привет. Сегодня день тренировки.',
          ],
          dayId,
        ),
        ...(plan ? [plan] : []),
        'Идёшь?',
      ].join('\n'),
      buttons,
    );
  }

  public eveningMessage(dayId: number, nextMorning = false): MessengerMessage {
    return msg(
      nextMorning
        ? pick(
            [
              'Как вчера прошло: тренировка была?',
              'Вчера бот не дождался отметки. Тренировка была?',
            ],
            dayId,
          )
        : pick(
            ['Потренировался сегодня?', 'Как день, получилось потренироваться?'],
            dayId,
          ),
      [[btn('💪 Да', `pd:pm:${dayId}:y`), btn('😴 Нет', `pd:pm:${dayId}:n`)]],
    );
  }

  /** Мягкий сброс после срыва: малый шаг вместо упрёка. */
  public comebackMessage(
    dayId: number,
    complexName: string | null,
    freshStart: boolean,
  ): MessengerMessage {
    return msg(
      [
        freshStart
          ? 'Новая неделя — чистый лист.'
          : 'Пара дней без тренировок — это нормально.',
        complexName
          ? `Можно начать с лёгкой «${complexName}» — хватит и половины подходов.`
          : 'Можно начать с короткой тренировки — хватит и 20 минут.',
      ].join('\n'),
      [
        [btn('💪 Начну сегодня', `pd:cb:${dayId}:y`)],
        [btn('Позже', `pd:cb:${dayId}:n`), appBtn(APP_SCREEN.today)],
      ],
    );
  }

  /** После двух дней молчания бот предлагает сам снизить частоту, а не копит игнор. */
  public lessOftenMessage(): MessengerMessage {
    return msg(
      'Бот пишет, а ответов нет. Как удобнее?',
      [
        [btn('Без повторов', 'pd:fq:0:e')],
        [btn('Не писать, отмечу в приложении', 'pd:fq:0:o')],
        [btn('Оставить как есть', 'pd:fq:0:k')],
      ],
    );
  }

  /** Ответ на предложение писать реже. */
  public async setFrequency(
    profile: SportProfile,
    mode: 'e' | 'o' | 'k',
  ): Promise<string> {
    const { userId } = profile;
    if (mode === 'k') {
      await this.prisma.sportProfile.update({
        where: { userId },
        data: { ignoredInRow: 0 },
      });
      return 'Хорошо, ничего не меняю.';
    }
    await this.prisma.sportProfile.update({
      where: { userId },
      data:
        mode === 'e'
          ? { ignoredInRow: 0, remindersEnabled: false }
          : { ignoredInRow: 0, questionsEnabled: false },
    });
    this.logger.log(`Частота вопросов снижена: userId=${userId}, режим=${mode}`);
    return mode === 'e'
      ? 'Готово: без повторов. Вернуть можно в настройках.'
      : 'Готово: бот не пишет вопросов. Тренировки отмечай в приложении, вернуть вопросы можно в настройках.';
  }

  public unfinishedMessage(workout: {
    id: number;
    complexName: string;
    done: number;
    total: number;
  }): MessengerMessage {
    return msg(
      `Тренировка «${workout.complexName}» не закрыта: сделано ${workout.done} из ${workout.total}. Закончил?`,
      [
        [
          btn('Да, завершить', `wo:fin:${workout.id}`),
          btn('Продолжаю', 'wo:cont'),
        ],
      ],
    );
  }

  // ── Ответы ──────────────────────────────────────────────────────────────

  /**
   * Записать ответ на утренний или вечерний вопрос. Кнопка сама проверяет актуальность:
   * ответ пишется только в день, который ещё ждёт его. @returns день или null — кнопка устарела.
   */
  public async answer(
    userId: number,
    dayId: number,
    poll: 'morning' | 'evening',
    answer: PollAnswer,
  ): Promise<PlanDay | null> {
    const field = poll === 'morning' ? 'morningAnswer' : 'eveningAnswer';
    const { count } = await this.prisma.planDay.updateMany({
      where: { id: dayId, userId, status: 'PENDING', [field]: null },
      data: { [field]: answer },
    });
    if (!count) return null;
    // Любой ответ снимает счётчик молчания
    await this.prisma.sportProfile.updateMany({
      where: { userId, ignoredInRow: { gt: 0 } },
      data: { ignoredInRow: 0 },
    });
    this.logger.log(
      `Ответ на опрос: planDayId=${dayId}, userId=${userId}, ${poll}=${answer}`,
    );
    return this.prisma.planDay.findUnique({ where: { id: dayId } });
  }

  /** Вечернее «да»: засчитывается комплекс, предложенный утром или выбранный вручную. */
  public async confirmDone(
    profile: SportProfile,
    day: PlanDay,
    workoutClientId?: string,
  ): Promise<CompleteResult> {
    return this.workouts.completeFromPlan(
      profile,
      day.date,
      day.suggestedComplexId,
      undefined,
      workoutClientId,
    );
  }

  /**
   * Пропуск дня: запись, предложение переноса и — после трёх пропусков подряд — паузы.
   * @returns сообщения пользователю; пусто — день уже не ждал ответа.
   */
  public async miss(
    profile: SportProfile,
    dayId: number,
  ): Promise<MessengerMessage[]> {
    const result = await this.missDay(profile, dayId);
    if (!result.changed) return [];
    const missText = result.streakSaved
      ? 'Записал пропуск. Заморозка сохранила серию — следующая будет через 2 недели.'
      : 'Записал пропуск. Рекорд серии остаётся.';
    const messages: MessengerMessage[] = [
      result.canReschedule
        ? msg(`${missText} Напомнить завтра?`, [
            [
              btn('Да, завтра', `pd:rs:${dayId}:y`),
              btn('Нет', `pd:rs:${dayId}:n`),
            ],
          ])
        : msg(missText),
    ];
    if (result.suggestPause) messages.push(this.pauses.offerMessage());
    return messages;
  }

  /** Пропуск дня без сообщений: общая часть для бота и приложения. */
  public async missDay(
    profile: SportProfile,
    dayId: number,
    /** День пропуска: с телефона ответ может дойти позже — «завтра» считается от него */
    date = localToday(profile.timeZone),
  ): Promise<MissOutcome> {
    const result = await this.planDays.markMissed(profile.userId, dayId);
    if (!result.changed)
      return { changed: false, canReschedule: false, suggestPause: false };
    const tomorrow = addDays(date, 1);
    // Завтра и так тренировочный день — перенос не предлагается
    const canReschedule =
      !result.wasRescheduled &&
      !profile.trainingDays.includes(weekdayOf(tomorrow));
    if (canReschedule)
      await this.prisma.planDay.updateMany({
        where: { id: dayId },
        data: { rescheduleOfferedAt: new Date() },
      });
    return {
      changed: true,
      canReschedule,
      suggestPause: result.suggestPause,
      streakSaved: !!result.streakSaved,
    };
  }

  // ── Сегодня из приложения ───────────────────────────────────────────────

  /**
   * «Сегодня не буду» в приложении — как утреннее «нет» в боте (frontend-tz, 7).
   * День плана заводится сам, если утренний вопрос ещё не задавался: после ответа бот про день не спросит.
   */
  public async skipToday(
    profile: SportProfile,
    date = localToday(profile.timeZone),
    dayClientId?: string,
  ): Promise<MissOutcome> {
    const day = await this.todayForAnswer(profile, date, dayClientId);
    await this.prisma.planDay.updateMany({
      where: { id: day.id, morningAnswer: null },
      data: { morningAnswer: 'NO' },
    });
    this.logger.log(
      `«Сегодня не буду» из приложения: planDayId=${day.id}, userId=${profile.userId}`,
    );
    return this.missDay(profile, day.id, date);
  }

  /** Вечерний ответ из приложения: «да» засчитывает комплекс дня, «нет» — пропуск. */
  public async answerEveningToday(
    profile: SportProfile,
    yes: boolean,
    date = localToday(profile.timeZone),
    workoutClientId?: string,
    dayClientId?: string,
  ): Promise<EveningOutcome> {
    const day = await this.todayForAnswer(profile, date, dayClientId);
    const answered = await this.answer(
      profile.userId,
      day.id,
      'evening',
      yes ? 'YES' : 'NO',
    );
    if (!answered)
      throw new BadRequestException('На этот вопрос ответ уже есть.');
    if (yes)
      return {
        done: await this.confirmDone(profile, answered, workoutClientId),
        missed: null,
      };
    return { done: null, missed: await this.missDay(profile, day.id, date) };
  }

  /** «Нет» на «напомнить завтра»: вопрос больше не показывается. */
  public async declineReschedule(
    profile: SportProfile,
    dayId: number,
  ): Promise<void> {
    await this.prisma.planDay.updateMany({
      where: { id: dayId, userId: profile.userId },
      data: { rescheduleOfferedAt: null },
    });
    this.logger.log(
      `Перенос не нужен: planDayId=${dayId}, userId=${profile.userId}`,
    );
  }

  /** «Напомнить завтра»: разовый утренний вопрос вне расписания. */
  public async reschedule(
    profile: SportProfile,
    dayId: number,
    /** Пропущенный день: перенос — на следующий за ним, даже если ответ дошёл позже */
    missedDate = localToday(profile.timeZone),
  ): Promise<void> {
    const userId = profile.userId;
    const { count } = await this.prisma.planDay.updateMany({
      where: { id: dayId, userId, rescheduleOfferedAt: { not: null } },
      data: { rescheduleOfferedAt: null },
    });
    if (!count) throw new BadRequestException('Кнопка устарела');
    const date = addDays(missedDate, 1);
    await this.prisma.planDay.upsert({
      where: { userId_date: { userId, date } },
      update: {},
      create: { userId, date, type: 'RESCHEDULED' },
    });
    this.logger.log(
      `Перенос на завтра: userId=${userId}, пропущенный planDayId=${dayId}`,
    );
  }

  // ── История и исправление ───────────────────────────────────────────────

  public async history(profile: SportProfile): Promise<PlanDay[]> {
    const today = localToday(profile.timeZone);
    return this.prisma.planDay.findMany({
      where: {
        userId: profile.userId,
        type: 'PLANNED',
        date: { gte: addDays(today, -FIX_WINDOW_DAYS), lte: today },
      },
      orderBy: { date: 'desc' },
    });
  }

  /** Исправление отметки → «тренировка была»: создаётся тренировка простого вида, ротация сдвигается. */
  public async fixToDone(
    profile: SportProfile,
    dayId: number,
    workoutClientId?: string,
  ): Promise<CompleteResult> {
    const today = localToday(profile.timeZone);
    const day = await this.prisma.planDay.findFirst({
      where: {
        id: dayId,
        userId: profile.userId,
        status: { in: ['MISSED', 'PENDING'] },
        date: { gte: addDays(today, -FIX_WINDOW_DAYS), lte: today },
      },
    });
    if (!day)
      throw new BadRequestException('Эту отметку уже нельзя исправить.');
    const result = await this.workouts.completeFromPlan(
      profile,
      day.date,
      day.suggestedComplexId,
      day.id,
      workoutClientId,
    );
    this.logger.log(
      `Отметка исправлена → DONE: planDayId=${dayId}, userId=${profile.userId}`,
    );
    return result;
  }

  /**
   * Исправление отметки → «пропуск»: простая тренировка удаляется, детальная остаётся в истории,
   * но отвязывается от дня. Ротация назад не откатывается.
   */
  public async fixToMissed(
    profile: SportProfile,
    dayId: number,
  ): Promise<void> {
    const userId = profile.userId;
    const today = localToday(profile.timeZone);
    const day = await this.prisma.planDay.findFirst({
      where: {
        id: dayId,
        userId,
        status: { in: ['DONE', 'PENDING'] },
        date: { gte: addDays(today, -FIX_WINDOW_DAYS), lte: today },
      },
    });
    if (!day)
      throw new BadRequestException('Эту отметку уже нельзя исправить.');
    await this.prisma.planDay.update({
      where: { id: dayId },
      data: { status: 'MISSED', workoutId: null },
    });
    if (day.workoutId) await this.workouts.detachFromDay(userId, day.workoutId);
    await this.planDays.recalcStreak(userId);
    this.logger.log(
      `Отметка исправлена → MISSED: planDayId=${dayId}, userId=${userId}`,
    );
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /** Сегодняшний день плана, который ждёт ответа; до утреннего вопроса его ещё нет — заводим. */
  private async todayForAnswer(
    profile: SportProfile,
    today = localToday(profile.timeZone),
    /** clientId дня, заведённого на телефоне: следующие операции телефона найдут его по нему */
    dayClientId?: string,
  ): Promise<PlanDay> {
    const userId = profile.userId;
    const existing = await this.planDays.find(userId, today);
    if (!existing && !profile.trainingDays.includes(weekdayOf(today)))
      throw new BadRequestException('Сегодня не тренировочный день.');
    const day =
      existing ??
      (await this.prisma.planDay.upsert({
        where: { userId_date: { userId, date: today } },
        update: {},
        create: {
          userId,
          date: today,
          ...(dayClientId ? { clientId: dayClientId } : {}),
        },
      }));
    if (day.status !== 'PENDING')
      throw new BadRequestException('Ответ на сегодня уже есть.');
    return day;
  }
}
