import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { SportAccountService } from '@/bot/sport-account.service';
import { PollService } from '@/plan/poll.service';
import { parsePayload } from '@/sync/sync-payload';
import { SyncPushService } from '@/sync/sync-push.service';
import { SyncOpContext, SyncOpOutcome } from '@/sync/sync-op.types';

import { DayService } from './day.service';
import { SyncDayDateDto } from './dto/sync/sync-day-date.dto';
import { SyncDayEveningDto } from './dto/sync/sync-day-evening.dto';
import { SyncDayFixDto } from './dto/sync/sync-day-fix.dto';
import { SyncDayPickDto } from './dto/sync/sync-day-pick.dto';
import { SyncDayRescheduleDto } from './dto/sync/sync-day-reschedule.dto';

const dayOf = (value: string) => new Date(`${value}T00:00:00.000Z`);

/**
 * Ответы дня с телефона (офлайн-синк, этап 2). День ищется по дате с телефона, а не по «сегодня»
 * сервера: ответ, данный вечером без сети, может дойти утром. День уже не ждёт ответа — skipped:
 * его закрыл бот или крон, повторно отвечать нечего.
 */
@Injectable()
export class DaySyncService implements OnModuleInit {
  private readonly logger = new Logger(`🗓 ${DaySyncService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: SyncPushService,
    private readonly accounts: SportAccountService,
    private readonly days: DayService,
    private readonly polls: PollService,
  ) {}

  public onModuleInit() {
    this.push.register('day.pick', (ctx) => this.pick(ctx));
    this.push.register('day.skip', (ctx) => this.skip(ctx));
    this.push.register('day.evening', (ctx) => this.evening(ctx));
    this.push.register('day.reschedule', (ctx) => this.reschedule(ctx));
    this.push.register('day.fix', (ctx) => this.fix(ctx));
    this.logger.log('Операции дня подключены к синку: 5');
  }

  private async pick({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    const dto = await parsePayload(SyncDayPickDto, op.payload);
    const complex = await this.prisma.complex.findFirst({
      where: { clientId: dto.complexClientId, program: { ownerId: userId } },
      select: { id: true },
    });
    if (!complex) return { status: 'skipped', reason: 'Комплекс удалён' };
    await this.days.pickComplex(
      userId,
      complex.id,
      dayOf(dto.date),
      op.clientId,
    );
    return { status: 'applied', ids: await this.dayIds(userId, op.clientId) };
  }

  private async skip({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    const dto = await parsePayload(SyncDayDateDto, op.payload);
    if (await this.answered(userId, dto.date))
      return { status: 'skipped', reason: 'Ответ на этот день уже есть' };
    const profile = await this.accounts.profile(userId);
    await this.polls.skipToday(profile, dayOf(dto.date), op.clientId);
    return { status: 'applied', ids: await this.dayIds(userId, op.clientId) };
  }

  private async evening({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    const dto = await parsePayload(SyncDayEveningDto, op.payload);
    if (await this.answered(userId, dto.date))
      return { status: 'skipped', reason: 'Ответ на этот день уже есть' };
    const profile = await this.accounts.profile(userId);
    const outcome = await this.polls.answerEveningToday(
      profile,
      dto.yes,
      dayOf(dto.date),
      dto.workoutClientId,
      op.clientId,
    );
    return {
      status: 'applied',
      ids: {
        ...(await this.dayIds(userId, op.clientId)),
        ...(outcome.done && dto.workoutClientId
          ? { [dto.workoutClientId]: outcome.done.workoutId }
          : {}),
      },
    };
  }

  private async reschedule({
    userId,
    op,
  }: SyncOpContext): Promise<SyncOpOutcome> {
    const dto = await parsePayload(SyncDayRescheduleDto, op.payload);
    const day = await this.prisma.planDay.findFirst({
      where: { clientId: op.clientId, userId },
      select: { id: true, date: true, rescheduleOfferedAt: true },
    });
    if (!day?.rescheduleOfferedAt)
      return { status: 'skipped', reason: 'Перенос уже не предлагается' };
    const profile = await this.accounts.profile(userId);
    if (dto.accept) await this.polls.reschedule(profile, day.id, day.date);
    else await this.polls.declineReschedule(profile, day.id);
    return { status: 'applied' };
  }

  private async fix({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    const dto = await parsePayload(SyncDayFixDto, op.payload);
    const day = await this.prisma.planDay.findFirst({
      where: { clientId: op.clientId, userId },
      select: { id: true },
    });
    if (!day) return { status: 'skipped', reason: 'День не найден' };
    const profile = await this.accounts.profile(userId);
    if (dto.status === 'MISSED') {
      await this.polls.fixToMissed(profile, day.id);
      return { status: 'applied' };
    }
    const result = await this.polls.fixToDone(
      profile,
      day.id,
      dto.workoutClientId,
    );
    return {
      status: 'applied',
      ids: dto.workoutClientId
        ? { [dto.workoutClientId]: result.workoutId }
        : undefined,
    };
  }

  /**
   * id дня, если сервер завёл его с clientId телефона. Пусто — день уже был (завёл крон) со своим
   * clientId: телефон уберёт свою копию, а pull привезёт серверную
   */
  private async dayIds(
    userId: number,
    clientId: string,
  ): Promise<Record<string, number>> {
    const day = await this.prisma.planDay.findFirst({
      where: { clientId, userId },
      select: { id: true },
    });
    return day ? { [clientId]: day.id } : {};
  }

  /** День уже не ждёт ответа: отмечен или снят. Нет дня — ответ его заведёт */
  private async answered(userId: number, date: string): Promise<boolean> {
    const day = await this.prisma.planDay.findFirst({
      where: { userId, date: dayOf(date) },
      select: { status: true },
    });
    return !!day && day.status !== 'PENDING';
  }
}
