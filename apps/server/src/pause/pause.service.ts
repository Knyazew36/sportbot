import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { btn, localToday, msg } from '@/bot';
import { Pause, PauseOrigin, SportProfile } from '@/generated/prisma/client';
import { MessengerMessage } from '@/messengers';
import { PlanDayService } from '@/plan/plan-day.service';

@Injectable()
export class PauseService {
  private readonly logger = new Logger(`⏸ ${PauseService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly planDays: PlanDayService,
  ) {}

  // ── Чтение ──────────────────────────────────────────────────────────────

  public async active(profile: SportProfile): Promise<Pause | null> {
    return this.planDays.activePause(
      profile.userId,
      localToday(profile.timeZone),
    );
  }

  // ── Запись ──────────────────────────────────────────────────────────────

  /** Поставить паузу или продлить действующую. endDate = null — до отмены. */
  public async start(
    profile: SportProfile,
    endDate: Date | null,
    origin: PauseOrigin,
    /** clientId новой паузы с телефона: после синка у телефона та же строка */
    clientId?: string,
  ): Promise<Pause> {
    const userId = profile.userId;
    const today = localToday(profile.timeZone);
    const current = await this.planDays.activePause(userId, today);
    const pause = current
      ? await this.prisma.pause.update({
          where: { id: current.id },
          data: { endDate, endAskedAt: null },
        })
      : await this.prisma.pause.create({
          data: {
            userId,
            startDate: today,
            endDate,
            origin,
            ...(clientId ? { clientId } : {}),
          },
        });
    // Уже созданный день, который ещё ждёт ответа, перестаёт быть кандидатом в пропуски
    const { count } = await this.prisma.planDay.updateMany({
      where: { userId, status: 'PENDING', date: { gte: today } },
      data: { status: 'PAUSED' },
    });
    await this.prisma.sportProfile.update({
      where: { userId },
      data: { missedInRow: 0 },
    });
    this.logger.log(
      `Пауза ${current ? 'продлена' : 'поставлена'}: pauseId=${pause.id}, userId=${userId}, дней переведено в PAUSED=${count}`,
    );
    return pause;
  }

  /** @returns была ли действующая пауза. */
  public async end(profile: SportProfile): Promise<boolean> {
    return this.endByUser(profile.userId);
  }

  public async endByUser(userId: number): Promise<boolean> {
    const { count } = await this.prisma.pause.updateMany({
      where: { userId, endedAt: null },
      data: { endedAt: new Date() },
    });
    if (count) this.logger.log(`Пауза снята: userId=${userId}`);
    return count > 0;
  }

  /** Отметить, что вопрос «возвращаемся?» задан. @returns false — уже задавали. */
  public async markEndAsked(pauseId: number): Promise<boolean> {
    const { count } = await this.prisma.pause.updateMany({
      where: { id: pauseId, endedAt: null, endAskedAt: null },
      data: { endAskedAt: new Date() },
    });
    return count > 0;
  }

  // ── Приложение ──────────────────────────────────────────────────────────

  /** Пауза из приложения: «до даты» (последний день включительно) или «до отмены». */
  public async startByUser(
    userId: number,
    endDate: string | null,
    clientId?: string,
  ): Promise<{ startDate: string; endDate: string | null }> {
    const profile = await this.prisma.sportProfile.findUniqueOrThrow({
      where: { userId },
    });
    const end = endDate ? new Date(`${endDate}T00:00:00.000Z`) : null;
    if (end && end < localToday(profile.timeZone))
      throw new BadRequestException('Дата окончания уже прошла.');
    const pause = await this.start(profile, end, 'MANUAL', clientId);
    return {
      startDate: pause.startDate.toISOString().slice(0, 10),
      endDate: pause.endDate ? pause.endDate.toISOString().slice(0, 10) : null,
    };
  }

  // ── Сообщения для крона и опросов ───────────────────────────────────────

  public offerMessage(): MessengerMessage {
    return msg(
      'Три пропуска подряд. Поставить бота на паузу? Серия сохранится.',
      [
        [btn('До даты', 'pa:until:s'), btn('До отмены', 'pa:forever:s')],
        [btn('Не надо', 'pa:no')],
      ],
    );
  }

  public endedMessage(): MessengerMessage {
    return msg('Пауза закончилась. Возвращаемся к тренировкам?', [
      [btn('Да', 'pa:end'), btn('Продлить паузу', 'pa:ext')],
    ]);
  }
}
