import { Injectable, Logger } from '@nestjs/common';
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
          data: { userId, startDate: today, endDate, origin },
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
    const { count } = await this.prisma.pause.updateMany({
      where: { userId: profile.userId, endedAt: null },
      data: { endedAt: new Date() },
    });
    if (count) this.logger.log(`Пауза снята: userId=${profile.userId}`);
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
