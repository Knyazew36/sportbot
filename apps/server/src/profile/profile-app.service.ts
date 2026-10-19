import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { AvatarService } from '@/avatar/avatar.service';
import { localToday } from '@/bot';
import { SportAccountService } from '@/bot/sport-account.service';
import { BotChannel } from '@/generated/prisma/client';

import { CityResponseDto } from './dto/city.response.dto';
import { ProfileResponseDto } from './dto/profile.response.dto';
import { SetTimezoneDto } from './dto/set-timezone.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CITY_ZONES, ProfileService, zoneTitle } from './profile.service';

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

/** Профиль в Mini App (frontend-tz, 13): настройки расписания, тренировки, пояса, удаление данных. */
@Injectable()
export class ProfileAppService {
  private readonly logger = new Logger(`👤 ${ProfileAppService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: SportAccountService,
    private readonly profiles: ProfileService,
    private readonly avatars: AvatarService,
  ) {}

  public async view(userId: number): Promise<ProfileResponseDto> {
    const profile = await this.accounts.profile(userId);
    const today = localToday(profile.timeZone);
    const [pause, weight, user] = await Promise.all([
      this.prisma.pause.findFirst({
        where: { userId, endedAt: null, startDate: { lte: today } },
        orderBy: { id: 'desc' },
      }),
      this.prisma.bodyWeight.findFirst({
        where: { userId },
        orderBy: { date: 'desc' },
        select: { value: true },
      }),
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { avatarPath: true },
      }),
    ]);
    return {
      displayName: profile.displayName,
      avatarUrl: this.avatars.url(user.avatarPath),
      gender: profile.gender,
      timeZone: profile.timeZone,
      timeZoneTitle: zoneTitle(profile.timeZone),
      trainingDays: profile.trainingDays,
      morningTime: profile.morningTime,
      eveningTime: profile.eveningTime,
      remindersEnabled: profile.remindersEnabled,
      questionsEnabled: profile.questionsEnabled,
      weightAskFrequency: profile.weightAskFrequency,
      showRestTimer: profile.showRestTimer,
      restSeconds: profile.restSeconds,
      restAutoStart: profile.restAutoStart,
      timerSound: profile.timerSound,
      timerVibration: profile.timerVibration,
      pause: pause
        ? {
            endDate: pause.endDate ? isoDate(pause.endDate) : null,
            expired: !!pause.endDate && pause.endDate < today,
          }
        : null,
      lastBodyWeight: weight ? Number(weight.value) : null,
    };
  }

  public async update(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    await this.profiles.update(userId, {
      ...dto,
      ...(dto.trainingDays && {
        trainingDays: [...dto.trainingDays].sort((a, b) => a - b),
      }),
    });
    return this.view(userId);
  }

  public async uploadAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<ProfileResponseDto> {
    await this.avatars.upload(userId, file);
    return this.view(userId);
  }

  public async avatarFromMessenger(
    userId: number,
    channel: BotChannel,
  ): Promise<ProfileResponseDto> {
    await this.avatars.fromMessenger(userId, channel);
    return this.view(userId);
  }

  public async removeAvatar(userId: number): Promise<ProfileResponseDto> {
    await this.avatars.remove(userId);
    return this.view(userId);
  }

  public cities(): CityResponseDto[] {
    return CITY_ZONES;
  }

  /** Пояс — городом из списка или по текущему времени, как в боте. Автоопределения нет (frontend-tz, 13.1). */
  public async setTimezone(
    userId: number,
    dto: SetTimezoneDto,
  ): Promise<ProfileResponseDto> {
    let zone: string;
    if (dto.zone) {
      if (!CITY_ZONES.some((city) => city.zone === dto.zone))
        throw new BadRequestException('Такого города нет в списке.');
      zone = dto.zone;
    } else if (dto.localTime) {
      zone = this.profiles.zoneFromLocalTime(dto.localTime);
    } else {
      throw new BadRequestException('Выбери город или введи текущее время.');
    }
    await this.profiles.update(userId, { timeZone: zone });
    return this.view(userId);
  }

  /** «Удалить мои данные» (business-tz, 15): после этого приложение начнёт с первого запуска. */
  public async remove(userId: number): Promise<void> {
    await this.profiles.deleteAccount(userId);
    this.logger.log(`Данные удалены из приложения: userId=${userId}`);
  }
}
