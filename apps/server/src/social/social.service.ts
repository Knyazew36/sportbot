import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomBytes } from 'crypto';
import { PrismaService } from 'prisma/prisma.service';

import {
  APP_SCREEN,
  appBtn,
  BotSender,
  botStartLink,
  btn,
  fmtShort,
  localToday,
  msg,
} from '@/bot';
import { Prisma, SportProfile } from '@/generated/prisma/client';
import { PlanDayService } from '@/plan/plan-day.service';
import { ProgramService } from '@/program/program.service';
import { StatsService } from '@/stats/stats.service';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Об обновлении программы друга напоминаем не чаще раза в сутки. */
const UPDATE_NOTIFY_EVERY_MS = 24 * 60 * 60 * 1000;

/** Пара хранится один раз: userAId < userBId. */
const pair = (a: number, b: number) => ({
  userAId: Math.min(a, b),
  userBId: Math.max(a, b),
});

/** Условие «эти двое — друзья» для where любого запроса по пользователю friendId. */
export const friendOf = (userId: number): Prisma.UserWhereInput => ({
  OR: [
    { friendshipsA: { some: { userBId: userId } } },
    { friendshipsB: { some: { userAId: userId } } },
  ],
});

@Injectable()
export class SocialService {
  private readonly logger = new Logger(`👥 ${SocialService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sender: BotSender,
    private readonly programs: ProgramService,
    private readonly stats: StatsService,
    private readonly planDays: PlanDayService,
  ) {}

  // ── Приглашения ─────────────────────────────────────────────────────────

  /** Ссылки-приглашения под оба мессенджера: друг открывает ту, которой пользуется. */
  public async createInvite(
    userId: number,
  ): Promise<{ telegram?: string; max?: string }> {
    const code = randomBytes(9).toString('base64url');
    await this.prisma.friendInvite.create({
      data: {
        code,
        senderId: userId,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });
    this.logger.log(`Приглашение создано: userId=${userId}`);
    return {
      telegram: botStartLink('TELEGRAM', `fr_${code}`),
      max: botStartLink('MAX', `fr_${code}`),
    };
  }

  public async findInvite(code: string) {
    return this.prisma.friendInvite.findFirst({
      where: { code, expiresAt: { gt: new Date() } },
      include: { sender: { include: { sportProfile: true } } },
    });
  }

  /**
   * Принять приглашение: одноразовое, самого себя пригласить нельзя.
   * @returns имя нового друга.
   */
  public async acceptInvite(
    profile: SportProfile,
    inviteId: number,
  ): Promise<string> {
    const userId = profile.userId;
    const invite = await this.prisma.friendInvite.findFirst({
      where: { id: inviteId, expiresAt: { gt: new Date() } },
      include: { sender: { include: { sportProfile: true } } },
    });
    if (!invite) throw new BadRequestException('Приглашение устарело.');
    if (invite.senderId === userId)
      throw new BadRequestException('Самого себя пригласить нельзя.');
    const { count } = await this.prisma.friendInvite.deleteMany({
      where: { id: inviteId },
    });
    if (!count) throw new BadRequestException('Приглашение уже использовано.');
    try {
      await this.prisma.friendship.create({
        data: pair(userId, invite.senderId),
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new BadRequestException('Вы уже друзья.');
      throw error;
    }
    this.logger.log(
      `Дружба создана: userId=${userId} ↔ userId=${invite.senderId}`,
    );
    await this.sender.send(
      invite.sender,
      msg(`${profile.displayName} принял приглашение — теперь вы друзья.`, [
        [btn('👥 Друзья', 'fr:menu')],
        [appBtn(APP_SCREEN.friend(userId))],
      ]),
    );
    return invite.sender.sportProfile?.displayName ?? 'Друг';
  }

  // ── Друзья ──────────────────────────────────────────────────────────────

  public async friends(userId: number) {
    return this.prisma.user.findMany({
      where: friendOf(userId),
      include: { sportProfile: true },
      orderBy: { id: 'asc' },
    });
  }

  /** Профиль друга. Право на чужую статистику — наличием дружбы в where, без пред-запроса. */
  public async friendProfile(
    userId: number,
    friendId: number,
  ): Promise<SportProfile> {
    const friend = await this.prisma.user.findFirst({
      where: { id: friendId, ...friendOf(userId) },
      include: { sportProfile: true },
    });
    if (!friend?.sportProfile)
      throw new NotFoundException('Вы больше не друзья.');
    return friend.sportProfile;
  }

  /** Что друг видит: факт тренировок, серию, посещаемость, комплексы, нагрузку. Вес тела — нет. */
  public async friendCard(userId: number, friendId: number): Promise<string> {
    const profile = await this.friendProfile(userId, friendId);
    const today = localToday(profile.timeZone);
    const [pause, workouts, lines] = await Promise.all([
      this.planDays.activePause(friendId, today),
      this.prisma.workout.findMany({
        where: {
          userId: friendId,
          status: { in: ['FINISHED', 'AUTO_CLOSED'] },
        },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        take: 5,
        select: { date: true, complexName: true },
      }),
      this.stats.summaryLines(profile),
    ]);
    return [
      `${profile.displayName}${pause ? ' — на паузе' : ''}`,
      '',
      ...lines,
      '',
      'Последние тренировки:',
      workouts.length
        ? workouts
            .map((w) => `${fmtShort(w.date)} — ${w.complexName}`)
            .join('\n')
        : 'пока нет',
    ].join('\n');
  }

  /** Разрыв в один тап: второй уведомления не получает, доступ пропадает сразу у обоих. */
  public async unfriend(userId: number, friendId: number): Promise<void> {
    const { count } = await this.prisma.friendship.deleteMany({
      where: pair(userId, friendId),
    });
    if (count)
      this.logger.log(
        `Дружба разорвана: userId=${userId} ↔ userId=${friendId}`,
      );
  }

  // ── Обмен программой ────────────────────────────────────────────────────

  /** Предложить другу свою программу. */
  public async shareProgram(
    profile: SportProfile,
    programId: number,
    friendId: number,
  ): Promise<string> {
    const program = await this.programs.find(profile.userId, programId);
    const friend = await this.prisma.user.findFirst({
      where: { id: friendId, ...friendOf(profile.userId) },
      include: { sportProfile: true },
    });
    if (!friend) throw new NotFoundException('Вы больше не друзья.');
    const delivered = await this.sender.send(
      friend,
      msg(
        `${profile.displayName} делится программой «${program.name}». Забрать копию себе?`,
        [[btn('Забрать', `fr:take:${program.id}`), btn('Не надо', 'fr:skip')]],
      ),
    );
    if (!delivered)
      throw new BadRequestException(
        'Не смог написать другу: он остановил бота.',
      );
    this.logger.log(
      `Программа предложена: programId=${programId}, от userId=${profile.userId} к userId=${friendId}`,
    );
    return friend.sportProfile?.displayName ?? 'Друг';
  }

  /** Забрать копию программы друга. Дружба владельца и получателя — условием в where. */
  public async takeProgram(userId: number, programId: number) {
    const source = await this.prisma.program.findFirst({
      where: { id: programId, isTemplate: false, owner: friendOf(userId) },
      select: { id: true },
    });
    if (!source)
      throw new NotFoundException(
        'Программа недоступна: её удалили или вы больше не друзья.',
      );
    return this.programs.copy(source.id, userId);
  }

  /** «Обновить»: копия полностью заменяется версией автора. */
  public async updateCopy(userId: number, copyId: number): Promise<void> {
    await this.programs.resync(userId, copyId);
  }

  /** «Оставить как есть»: о текущей версии автора больше не напоминаем. */
  public async keepCopy(userId: number, copyId: number): Promise<void> {
    const copy = await this.prisma.program.findFirst({
      where: { id: copyId, ownerId: userId },
      select: { sourceProgram: { select: { contentUpdatedAt: true } } },
    });
    if (!copy?.sourceProgram) return;
    await this.prisma.program.update({
      where: { id: copyId },
      data: { sourceSyncedAt: copy.sourceProgram.contentUpdatedAt },
    });
  }

  /**
   * Раз в час: копии, у которых источник изменился после синхронизации, дружба владельцев жива
   * и последнее предложение обновиться было больше суток назад.
   */
  @Cron(CronExpression.EVERY_HOUR)
  public async notifyProgramUpdates(): Promise<void> {
    try {
      const copies = await this.prisma.program.findMany({
        where: {
          ownerId: { not: null },
          sourceProgram: { isTemplate: false, ownerId: { not: null } },
          OR: [
            { updateNotifiedAt: null },
            {
              updateNotifiedAt: {
                lt: new Date(Date.now() - UPDATE_NOTIFY_EVERY_MS),
              },
            },
          ],
        },
        include: {
          owner: true,
          sourceProgram: {
            include: { owner: { include: { sportProfile: true } } },
          },
        },
      });
      let sent = 0;
      for (const copy of copies) {
        const source = copy.sourceProgram;
        if (!source?.owner || !copy.owner) continue;
        if (
          copy.sourceSyncedAt &&
          source.contentUpdatedAt <= copy.sourceSyncedAt
        )
          continue;
        const friendship = await this.prisma.friendship.findUnique({
          where: { userAId_userBId: pair(copy.owner.id, source.owner.id) },
          select: { id: true },
        });
        // После разрыва дружбы копии остаются, уведомления прекращаются
        if (!friendship) continue;
        await this.prisma.program.update({
          where: { id: copy.id },
          data: { updateNotifiedAt: new Date() },
        });
        await this.sender.send(
          copy.owner,
          msg(
            `${source.owner.sportProfile?.displayName ?? 'Друг'} обновил программу «${source.name}». Обновить у себя?\nТвои правки в этой программе пропадут, история тренировок сохранится.`,
            [
              [
                btn('Обновить', `fr:upd:${copy.id}`),
                btn('Оставить как есть', `fr:keep:${copy.id}`),
              ],
              [appBtn(APP_SCREEN.program(copy.id))],
            ],
          ),
        );
        sent++;
      }
      if (sent) this.logger.log(`Уведомления об обновлении программ: ${sent}`);
    } catch (error) {
      this.logger.error(
        'Рассылка обновлений программ упала',
        (error as Error).stack,
      );
    }
  }
}
