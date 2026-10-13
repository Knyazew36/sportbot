import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from 'prisma/prisma.service';

import { BOT_CHANNEL_TITLE, BotChannelKey, otherBotChannel } from '@/bot';
import { AccountLinkCode, Prisma, User } from '@/generated/prisma/client';
import { ProfileService } from '@/profile/profile.service';

const CODE_TTL_MS = 15 * 60 * 1000;

export const LINK_EXPIRED =
  'Ссылка привязки устарела или уже использована. Запроси новую: Настройки → Мессенджеры.';

/** Где у User лежит аккаунт мессенджера и с чего начинаются его маркеры диалога в User.data. */
const COLUMNS = {
  TELEGRAM: { id: 'telegramId', markers: 'telegramDialog' },
  MAX: { id: 'maxId', markers: 'maxDialog' },
} as const;

/** Чей аккаунт остаётся: того, кто создал ссылку, или того, кто её открыл. */
export type LinkSide = 'owner' | 'visitor';

export interface AccountSummary {
  name: string;
  onboarded: boolean;
  workouts: number;
  /** Дата первой тренировки. */
  since: Date | null;
  programs: number;
  friends: number;
  streak: number;
  /** Терять нечего: первый запуск не закончен либо нет ни тренировок, ни программ, ни веса, ни друзей. */
  empty: boolean;
}

export interface LinkResult {
  /** Выживший аккаунт — уже с обоими мессенджерами. */
  keeper: User;
  onboarded: boolean;
}

const asRecord = (data: unknown): Record<string, unknown> =>
  data && typeof data === 'object' && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {};

/** Маркеры диалога одного мессенджера (own) либо всё остальное из User.data. */
const pickData = (
  data: unknown,
  channel: BotChannelKey,
  own: boolean,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(asRecord(data)).filter(
      ([key]) => key.startsWith(COLUMNS[channel].markers) === own,
    ),
  );

/**
 * Привязка второго мессенджера к аккаунту (Б15а). Аккаунты не сливаются: если данные есть в обоих,
 * пользователь выбирает, какой оставить, второй стирается как при «удалить мои данные».
 */
@Injectable()
export class LinkService {
  private readonly logger = new Logger(`🔗 ${LinkService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfileService,
  ) {}

  // ── Код привязки ────────────────────────────────────────────────────────

  /** Новый одноразовый код под мессенджер, который привязываем; прежние коды пользователя гаснут. */
  public async createCode(
    userId: number,
    channel: BotChannelKey,
  ): Promise<string> {
    const code = randomBytes(9).toString('base64url');
    await this.prisma.$transaction([
      this.prisma.accountLinkCode.deleteMany({ where: { userId } }),
      this.prisma.accountLinkCode.create({
        data: {
          code,
          userId,
          channel,
          expiresAt: new Date(Date.now() + CODE_TTL_MS),
        },
      }),
    ]);
    this.logger.log(`Код привязки ${channel} создан: userId=${userId}`);
    return code;
  }

  public findCode(
    code: string,
  ): Promise<(AccountLinkCode & { user: User }) | null> {
    return this.prisma.accountLinkCode.findFirst({
      where: { code, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
  }

  public async cancel(code: string): Promise<void> {
    await this.prisma.accountLinkCode.deleteMany({ where: { code } });
  }

  // ── Проверки ────────────────────────────────────────────────────────────

  /**
   * Почему эту пару аккаунтов связать нельзя; null — можно.
   * @param owner кто создал ссылку
   * @param visitor кто её открыл
   * @param target мессенджер, под который выдана ссылка
   * @param here мессенджер, в котором её открыли
   */
  public refusal(
    owner: User,
    visitor: User,
    target: BotChannelKey,
    here: BotChannelKey,
  ): string | null {
    const title = BOT_CHANNEL_TITLE;
    const other = otherBotChannel(target);
    if (owner.id === visitor.id)
      return 'Этот мессенджер уже привязан к твоему аккаунту.';
    if (target !== here)
      return `Эта ссылка для ${title[target]} — открой её там.`;
    if (owner[COLUMNS[target].id])
      return `К аккаунту уже привязан другой ${title[target]}. Сначала отвяжи его: Настройки → Мессенджеры.`;
    if (visitor[COLUMNS[other].id])
      return `Этот ${title[target]} уже привязан к другому ${title[other]}. Сначала отвяжи его: Настройки → Мессенджеры.`;
    return null;
  }

  public async summary(userId: number): Promise<AccountSummary> {
    const [profile, workouts, first, programs, weights, friends] =
      await Promise.all([
        this.prisma.sportProfile.findUnique({ where: { userId } }),
        this.prisma.workout.count({ where: { userId } }),
        this.prisma.workout.findFirst({
          where: { userId },
          orderBy: { date: 'asc' },
          select: { date: true },
        }),
        this.prisma.program.count({ where: { ownerId: userId } }),
        this.prisma.bodyWeight.count({ where: { userId } }),
        this.prisma.friendship.count({
          where: { OR: [{ userAId: userId }, { userBId: userId }] },
        }),
      ]);
    return {
      name: profile?.displayName ?? 'Без имени',
      onboarded: !!profile?.onboardedAt,
      workouts,
      since: first?.date ?? null,
      programs,
      friends,
      streak: profile?.currentStreak ?? 0,
      empty:
        !profile?.onboardedAt || workouts + programs + weights + friends === 0,
    };
  }

  // ── Привязка ────────────────────────────────────────────────────────────

  /**
   * Одной транзакцией: погасить код, стереть проигравший аккаунт, отдать его мессенджер выжившему.
   * Бросает понятный пользователю отказ, если ссылка устарела или пара аккаунтов не подходит.
   */
  public async link(params: {
    code: string;
    visitorId: number;
    here: BotChannelKey;
    keep: LinkSide;
  }): Promise<LinkResult> {
    const { code, visitorId, here, keep } = params;
    const result = await this.prisma.$transaction(async (tx) => {
      const link = await tx.accountLinkCode.findFirst({
        where: { code, expiresAt: { gt: new Date() } },
      });
      // Код гасится первым: второе нажатие «Привязать» упрётся сюда и ничего не сотрёт
      const burned = link
        ? await tx.accountLinkCode.deleteMany({ where: { id: link.id } })
        : { count: 0 };
      if (!link || !burned.count) throw new BadRequestException(LINK_EXPIRED);

      const owner = await tx.user.findUnique({ where: { id: link.userId } });
      const visitor = await tx.user.findUnique({ where: { id: visitorId } });
      if (!owner || !visitor) throw new BadRequestException(LINK_EXPIRED);
      const refusal = this.refusal(owner, visitor, link.channel, here);
      if (refusal) throw new BadRequestException(refusal);

      const [keeper, loser] =
        keep === 'owner' ? [owner, visitor] : [visitor, owner];
      // Строка с почтой — веб-аккаунт: вместе с ней пропал бы вход по почте
      if (loser.email)
        throw new ConflictException(
          'У второго аккаунта есть вход по почте — удалить его при привязке нельзя.',
        );

      // К выжившему переезжает мессенджер, которого у него нет
      const moved =
        keep === 'owner' ? link.channel : otherBotChannel(link.channel);
      await this.profiles.eraseUser(tx, loser.id);
      const identity: Prisma.UserUncheckedUpdateInput =
        moved === 'TELEGRAM'
          ? {
              telegramId: loser.telegramId,
              telegramData: loser.telegramData ?? Prisma.DbNull,
            }
          : { maxId: loser.maxId, maxData: loser.maxData ?? Prisma.DbNull };
      const merged = await tx.user.update({
        where: { id: keeper.id },
        data: {
          ...identity,
          // «Может ли бот писать» в переехавший мессенджер знает только проигравший
          data: {
            ...pickData(keeper.data, moved, false),
            ...pickData(loser.data, moved, true),
          } as Prisma.InputJsonValue,
        },
      });
      // Куда писать, спросим заново: мессенджеров стало два
      await tx.sportProfile.updateMany({
        where: { userId: keeper.id },
        data: { notifyChannels: [] },
      });
      const profile = await tx.sportProfile.findUnique({
        where: { userId: keeper.id },
        select: { onboardedAt: true },
      });
      this.logger.log(
        `Мессенджеры связаны: остался userId=${keeper.id}, стёрт userId=${loser.id}, переехал ${moved}`,
      );
      return { keeper: merged, onboarded: !!profile?.onboardedAt };
    });
    return result;
  }

  // ── Отвязка и доставка ──────────────────────────────────────────────────

  /** Какие мессенджеры привязаны и куда бот пишет сам (пусто — не выбрано). */
  public async state(
    userId: number,
  ): Promise<{ linked: BotChannelKey[]; notify: BotChannelKey[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { sportProfile: { select: { notifyChannels: true } } },
    });
    return {
      linked: (['TELEGRAM', 'MAX'] as const).filter(
        (channel) => !!user?.[COLUMNS[channel].id],
      ),
      notify: user?.sportProfile?.notifyChannels ?? [],
    };
  }

  public async setNotifyChannels(
    userId: number,
    channels: BotChannelKey[],
  ): Promise<void> {
    await this.prisma.sportProfile.update({
      where: { userId },
      data: { notifyChannels: channels },
    });
    this.logger.log(
      `Куда писать: userId=${userId}, ${channels.join('+') || 'по умолчанию'}`,
    );
  }

  /** Отвязать мессенджер: данные остаются у аккаунта, в отвязанном чате бот начнёт с нуля. */
  public async unlink(userId: number, channel: BotChannelKey): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      const rest = otherBotChannel(channel);
      if (!user?.[COLUMNS[channel].id] || !user[COLUMNS[rest].id])
        throw new BadRequestException(
          'Отвязать можно только второй мессенджер, когда привязаны оба.',
        );
      const identity: Prisma.UserUncheckedUpdateInput =
        channel === 'TELEGRAM'
          ? { telegramId: null, telegramData: Prisma.DbNull }
          : { maxId: null, maxData: Prisma.DbNull };
      await tx.user.update({
        where: { id: userId },
        data: {
          ...identity,
          data: pickData(user.data, channel, false) as Prisma.InputJsonValue,
        },
      });
      await tx.botSession.deleteMany({ where: { userId, channel } });
      await tx.botGroupMember.deleteMany({
        where: { userId, group: { channel } },
      });
      await tx.sportProfile.updateMany({
        where: { userId },
        data: { notifyChannels: [] },
      });
    });
    this.logger.log(`Мессенджер отвязан: userId=${userId}, ${channel}`);
  }
}
