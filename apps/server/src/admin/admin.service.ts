import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { addDays, weekStart } from '@/bot';
import { User } from '@/generated/prisma/client';
import { ModerationService } from '@/moderation/moderation.service';
import { PROGRAM_REVIEW_QUEUE } from '@/program-publication/program-publication.service';

import { AdminStatsResponseDto } from './dto/admin-stats.response.dto';

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
    const [
      users,
      workouts,
      requests,
      complaints,
      programReviews,
      exercises,
      stretches,
    ] = await Promise.all([
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
      this.prisma.program.count({ where: PROGRAM_REVIEW_QUEUE }),
      this.prisma.exercise.count({ where: { status: 'CATALOG' } }),
      this.prisma.stretch.count({ where: { status: 'CATALOG' } }),
    ]);
    return {
      users,
      workouts,
      requests,
      complaints,
      programReviews,
      exercises,
      stretches,
    };
  }

  /** Обзор: сколько пользователей, кто тренируется, ряд по дням за 30 дней. Дни — по UTC, как у счётчиков. */
  public async stats(): Promise<AdminStatsResponseDto> {
    const today = new Date(new Date().setUTCHours(0, 0, 0, 0));
    const from7 = addDays(today, -6);
    const from30 = addDays(today, -29);
    const [
      usersTotal,
      usersOnboarded,
      usersNew7,
      usersNew30,
      workoutsTotal,
      [activity],
      days,
    ] = await Promise.all([
      this.prisma.sportProfile.count(),
      this.prisma.sportProfile.count({ where: { onboardedAt: { not: null } } }),
      this.prisma.sportProfile.count({ where: { createdAt: { gte: from7 } } }),
      this.prisma.sportProfile.count({ where: { createdAt: { gte: from30 } } }),
      this.prisma.workout.count({
        where: { status: { in: ['FINISHED', 'AUTO_CLOSED'] } },
      }),
      // Активный — начал тренировку: в боте и в приложении она создаётся одинаково
      this.prisma.$queryRaw<
        {
          activeToday: number;
          active7: number;
          active30: number;
          workouts7: number;
          workouts30: number;
        }[]
      >`
        SELECT
          count(DISTINCT "userId") FILTER (WHERE "date" = ${today}::date)::int AS "activeToday",
          count(DISTINCT "userId") FILTER (WHERE "date" >= ${from7}::date)::int AS "active7",
          count(DISTINCT "userId")::int AS "active30",
          count(*) FILTER (WHERE "status" <> 'IN_PROGRESS' AND "date" >= ${from7}::date)::int AS "workouts7",
          count(*) FILTER (WHERE "status" <> 'IN_PROGRESS')::int AS "workouts30"
        FROM "Workout"
        WHERE "date" >= ${from30}::date`,
      this.prisma.$queryRaw<
        {
          date: Date;
          newUsers: number;
          activeUsers: number;
          workouts: number;
        }[]
      >`
        SELECT
          d::date AS "date",
          (SELECT count(*) FROM "SportProfile" p
            WHERE p."createdAt" >= d AND p."createdAt" < d + interval '1 day')::int AS "newUsers",
          (SELECT count(DISTINCT w."userId") FROM "Workout" w
            WHERE w."date" = d::date)::int AS "activeUsers",
          (SELECT count(*) FROM "Workout" w
            WHERE w."date" = d::date AND w."status" <> 'IN_PROGRESS')::int AS "workouts"
        FROM generate_series(${from30}::date, ${today}::date, interval '1 day') d
        ORDER BY 1`,
    ]);
    this.logger.debug(
      `Обзор: пользователей=${usersTotal}, активных за 7 дней=${activity.active7}`,
    );
    return {
      usersTotal,
      usersOnboarded,
      usersNew7,
      usersNew30,
      workoutsTotal,
      ...activity,
      days: days.map((d) => ({
        ...d,
        date: d.date.toISOString().slice(0, 10),
      })),
    };
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
