import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { AvatarService } from '@/avatar/avatar.service';
import { addDays, BotChannelKey, localToday } from '@/bot';
import { SportAccountService } from '@/bot/sport-account.service';
import { COMPLEXES_INCLUDE, toComplexesDto } from '@/program/program-complexes';

import { FriendInviteResponseDto } from './dto/friend-invite.response.dto';
import { FriendProfileResponseDto } from './dto/friend-profile.response.dto';
import { FriendResponseDto } from './dto/friend.response.dto';
import { ProgramCopyResponseDto } from './dto/program-copy.response.dto';
import { SocialService } from './social.service';

const DONE = ['FINISHED', 'AUTO_CLOSED'] as const;

/**
 * Друзья в Mini App (frontend-tz, 13.6). Что видно о друге — по таблице видимости (business-tz, 15):
 * серия, тренировки, пауза, программы; вес тела и ограничения — нет.
 */
@Injectable()
export class SocialAppService {
  private readonly logger = new Logger(`👥 ${SocialAppService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: SportAccountService,
    private readonly social: SocialService,
    private readonly avatars: AvatarService,
  ) {}

  /** Список друзей: имя, серия, тренировался ли сегодня. */
  public async friends(userId: number): Promise<FriendResponseDto[]> {
    const friends = await this.social.friends(userId);
    const ids = friends.map((f) => f.id);
    if (!ids.length) return [];
    // Даты «сегодня» у друзей разные по поясам — берём с запасом в сутки и сверяем по каждому
    const minToday = addDays(
      new Date(new Date().toISOString().slice(0, 10)),
      -1,
    );
    const [workouts, pauses] = await Promise.all([
      this.prisma.workout.findMany({
        where: {
          userId: { in: ids },
          status: { in: [...DONE] },
          date: { gte: minToday },
        },
        select: { userId: true, date: true },
      }),
      this.prisma.pause.findMany({
        where: { userId: { in: ids }, endedAt: null },
        select: { userId: true, startDate: true },
      }),
    ]);
    return friends
      .filter((f) => f.sportProfile)
      .map((f) => {
        const today = localToday(f.sportProfile!.timeZone);
        return {
          id: f.id,
          displayName: f.sportProfile!.displayName,
          avatarUrl: this.avatars.url(f.avatarPath),
          currentStreak: f.sportProfile!.currentStreak,
          trainedToday: workouts.some(
            (w) => w.userId === f.id && w.date.getTime() === today.getTime(),
          ),
          paused: pauses.some((p) => p.userId === f.id && p.startDate <= today),
        };
      });
  }

  /** Профиль друга: серия, пауза и его программы с «Скопировать себе». Статистика — /stats?userId. */
  public async friend(
    userId: number,
    friendId: number,
  ): Promise<FriendProfileResponseDto> {
    const profile = await this.social.friendProfile(userId, friendId);
    const today = localToday(profile.timeZone);
    const [pause, programs] = await Promise.all([
      this.prisma.pause.findFirst({
        where: { userId: friendId, endedAt: null, startDate: { lte: today } },
        orderBy: { id: 'desc' },
      }),
      this.prisma.program.findMany({
        where: { ownerId: friendId },
        orderBy: { id: 'asc' },
        include: { complexes: COMPLEXES_INCLUDE },
      }),
    ]);
    this.logger.debug(`Профиль друга: userId=${userId}, friendId=${friendId}`);
    return {
      id: friendId,
      displayName: profile.displayName,
      avatarUrl: this.avatars.url(profile.avatarPath),
      currentStreak: profile.currentStreak,
      bestStreak: profile.bestStreak,
      paused: !!pause,
      pauseEndDate: pause?.endDate
        ? pause.endDate.toISOString().slice(0, 10)
        : null,
      programs: programs.map((p) => ({
        id: p.id,
        name: p.name,
        complexCount: p.complexes.length,
        active: p.id === profile.activeProgramId,
        // Очередь друга чужому не показываем — «следующего» комплекса нет
        complexes: toComplexesDto(p.complexes, null),
      })),
    };
  }

  /** Ссылка-приглашение на бота (business-tz, 10.1): в «Поделиться» — мессенджера, откуда открыто приложение. */
  public async invite(
    userId: number,
    channel: BotChannelKey | null,
  ): Promise<FriendInviteResponseDto> {
    const [links, profile] = await Promise.all([
      this.social.createInvite(userId),
      this.accounts.profile(userId),
    ]);
    const preferred = channel === 'MAX' ? links.max : links.telegram;
    const url = preferred ?? links.telegram ?? links.max;
    if (!url)
      throw new BadRequestException('Бот не подключён ни в одном мессенджере.');
    return {
      url,
      telegram: links.telegram ?? null,
      max: links.max ?? null,
      text: 'Зову тебя тренироваться со мной вместе в Спортботе.\n\nНажимай на ссылку ниже',
    };
  }

  /** «Удалить из друзей»: второй стороне уведомление не приходит. */
  public unfriend(userId: number, friendId: number): Promise<void> {
    return this.social.unfriend(userId, friendId);
  }

  /** «Скопировать себе» программу друга. */
  public async copyProgram(
    userId: number,
    programId: number,
  ): Promise<ProgramCopyResponseDto> {
    const copy = await this.social.takeProgram(userId, programId);
    this.logger.log(
      `Копия программы друга: programId=${programId} → ${copy.id}, userId=${userId}`,
    );
    return { programId: copy.id };
  }
}
