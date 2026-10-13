import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { addDays, weekStart } from '@/bot';
import { ComplaintStatus, User } from '@/generated/prisma/client';
import { ModerationService } from '@/moderation/moderation.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(`🛠 ${AdminService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: ModerationService,
  ) {}

  // ── Счётчики ────────────────────────────────────────────────────────────

  public async counters() {
    const monday = weekStart(new Date(new Date().setUTCHours(0, 0, 0, 0)));
    const [users, workouts, requests, complaints, exercises, stretches] =
      await Promise.all([
        this.prisma.sportProfile.count({
          where: { onboardedAt: { not: null } },
        }),
        this.prisma.workout.count({
          where: {
            status: { in: ['FINISHED', 'AUTO_CLOSED'] },
            date: { gte: monday, lt: addDays(monday, 7) },
          },
        }),
        this.prisma.moderationRequest.count({ where: { outcome: 'PENDING' } }),
        this.prisma.complaint.count({ where: { status: 'OPEN' } }),
        this.prisma.exercise.count({ where: { status: 'CATALOG' } }),
        this.prisma.stretch.count({ where: { status: 'CATALOG' } }),
      ]);
    return { users, workouts, requests, complaints, exercises, stretches };
  }

  // ── Жалобы ──────────────────────────────────────────────────────────────

  public async openComplaints() {
    return this.prisma.complaint.findMany({
      where: { status: 'OPEN' },
      orderBy: { id: 'asc' },
      take: 10,
      include: {
        exercise: { select: { name: true } },
        stretch: { select: { name: true } },
        user: { select: { sportProfile: { select: { displayName: true } } } },
      },
    });
  }

  /** Жалоба меняется только из OPEN: повторное нажатие получает «уже обработано». */
  public async closeComplaint(
    complaintId: number,
    status: Exclude<ComplaintStatus, 'OPEN'>,
  ): Promise<boolean> {
    const { count } = await this.prisma.complaint.updateMany({
      where: { id: complaintId, status: 'OPEN' },
      data: { status },
    });
    if (count)
      this.logger.log(
        `Жалоба закрыта: complaintId=${complaintId}, статус=${status}`,
      );
    return count > 0;
  }

  // ── Блокировка ──────────────────────────────────────────────────────────

  /** Поиск пользователя по имени или id. */
  public async findUsers(query: string) {
    const text = query.trim();
    const id = /^\d+$/.test(text) ? Number(text) : undefined;
    return this.prisma.user.findMany({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          {
            sportProfile: {
              displayName: { contains: text, mode: 'insensitive' },
            },
          },
          { name: { contains: text, mode: 'insensitive' } },
        ],
      },
      include: { sportProfile: { select: { displayName: true } } },
      take: 10,
      orderBy: { id: 'asc' },
    });
  }

  public async userCard(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { sportProfile: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден.');
    return { user, blocked: await this.isBlocked(user) };
  }

  /** Блокировка по всем привязанным мессенджерам; заявки пользователя в PENDING отклоняются. */
  public async block(userId: number): Promise<void> {
    const { user } = await this.userCard(userId);
    for (const account of this.accounts(user))
      await this.prisma.blockedAccount.upsert({
        where: { channel_externalId: account },
        update: {},
        create: { ...account, reason: 'заблокирован администратором' },
      });
    const rejected = await this.moderation.rejectAllOf(userId);
    this.logger.log(
      `Пользователь заблокирован: userId=${userId}, отклонено заявок=${rejected}`,
    );
  }

  public async unblock(userId: number): Promise<void> {
    const { user } = await this.userCard(userId);
    const accounts = this.accounts(user);
    if (accounts.length)
      await this.prisma.blockedAccount.deleteMany({ where: { OR: accounts } });
    this.logger.log(`Пользователь разблокирован: userId=${userId}`);
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private accounts(user: User) {
    return [
      ...(user.telegramId
        ? [{ channel: 'TELEGRAM' as const, externalId: user.telegramId }]
        : []),
      ...(user.maxId
        ? [{ channel: 'MAX' as const, externalId: user.maxId }]
        : []),
    ];
  }

  private async isBlocked(user: User): Promise<boolean> {
    const accounts = this.accounts(user);
    if (!accounts.length) return false;
    return (
      (await this.prisma.blockedAccount.count({ where: { OR: accounts } })) > 0
    );
  }
}
