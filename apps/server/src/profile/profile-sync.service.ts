import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';

import { freshFields } from '@/sync/field-stamps';
import { parsePayload } from '@/sync/sync-payload';
import { SyncPushService } from '@/sync/sync-push.service';
import { SyncOpContext, SyncOpOutcome } from '@/sync/sync-op.types';

import { SyncTimezoneDto } from './dto/sync/sync-timezone.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileAppService } from './profile-app.service';
import { CITY_ZONES, ProfileService } from './profile.service';

const OUTDATED: SyncOpOutcome = {
  status: 'skipped',
  reason: 'Изменено позже на другом устройстве',
};

/** Пояс по смещению, посчитанный на телефоне по «сколько у тебя сейчас» */
const ETC_ZONE = /^Etc\/GMT(?:[+-]\d{1,2})?$/;

/**
 * Настройки с телефона (офлайн-синк, этап 5): поля — те же, что у формы приложения.
 * Поле меняется, только если его не правили позже времени операции (fieldUpdatedAt): правка в вебе
 * или боте, сделанная после офлайн-правки, остаётся
 */
@Injectable()
export class ProfileSyncService implements OnModuleInit {
  private readonly logger = new Logger(`👤 ${ProfileSyncService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: SyncPushService,
    private readonly app: ProfileAppService,
    private readonly profiles: ProfileService,
  ) {}

  public onModuleInit() {
    this.push.register('profile.update', (ctx) => this.update(ctx));
    this.push.register('timezone.set', (ctx) => this.timezone(ctx));
    this.logger.log('Операции профиля подключены к синку: 2');
  }

  private async update({
    userId,
    op,
    at,
  }: SyncOpContext): Promise<SyncOpOutcome> {
    const dto = await parsePayload(UpdateProfileDto, op.payload);
    const fields = freshFields(dto, await this.stampsOf(userId), at);
    if (!Object.keys(fields).length) return OUTDATED;
    if (Object.keys(fields).length < Object.keys(dto).length)
      this.logger.log(
        `Офлайн-правка профиля частично устарела: userId=${userId}, применены: ${Object.keys(fields).join(', ')}`,
      );
    await this.app.update(userId, fields, at);
    return { status: 'applied' };
  }

  private async timezone({
    userId,
    op,
    at,
  }: SyncOpContext): Promise<SyncOpOutcome> {
    const { zone } = await parsePayload(SyncTimezoneDto, op.payload);
    if (!CITY_ZONES.some((city) => city.zone === zone) && !ETC_ZONE.test(zone))
      throw new BadRequestException('Такого часового пояса нет.');
    if (!freshFields({ timeZone: zone }, await this.stampsOf(userId), at).timeZone)
      return OUTDATED;
    await this.profiles.update(userId, { timeZone: zone }, at);
    return { status: 'applied' };
  }

  private async stampsOf(userId: number) {
    const row = await this.prisma.sportProfile.findUnique({
      where: { userId },
      select: { fieldUpdatedAt: true },
    });
    return row?.fieldUpdatedAt ?? {};
  }
}
