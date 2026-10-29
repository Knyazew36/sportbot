import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { parsePayload } from '@/sync/sync-payload';
import { SyncPushService } from '@/sync/sync-push.service';
import { SyncOpContext, SyncOpOutcome } from '@/sync/sync-op.types';

import { OnboardingDaysDto } from './dto/onboarding-days.dto';
import { OnboardingGenderDto } from './dto/onboarding-gender.dto';
import { OnboardingTimesDto } from './dto/onboarding-times.dto';
import { SyncOnboardingFinishDto } from './dto/sync/sync-onboarding-finish.dto';
import { OnboardingService } from './onboarding.service';

const APPLIED: SyncOpOutcome = { status: 'applied' };

/**
 * Первый запуск с телефона без сети: те же шаги, что у REST онбординга, — сервис общий,
 * поэтому шаг, начатый в боте, и тут двигается только вперёд
 */
@Injectable()
export class OnboardingSyncService implements OnModuleInit {
  private readonly logger = new Logger(`🚀 ${OnboardingSyncService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: SyncPushService,
    private readonly onboarding: OnboardingService,
  ) {}

  public onModuleInit() {
    this.push.register('onboarding.gender', (ctx) => this.gender(ctx));
    this.push.register('onboarding.days', (ctx) => this.days(ctx));
    this.push.register('onboarding.times', (ctx) => this.times(ctx));
    this.push.register('onboarding.finish', (ctx) => this.finish(ctx));
    this.logger.log('Операции онбординга подключены к синку: 4');
  }

  // ── Шаги ────────────────────────────────────────────────────────────────

  private async gender({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    await this.onboarding.saveGender(userId, await parsePayload(OnboardingGenderDto, op.payload));
    return APPLIED;
  }

  private async days({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    await this.onboarding.saveDays(userId, await parsePayload(OnboardingDaysDto, op.payload));
    return APPLIED;
  }

  private async times({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    await this.onboarding.saveTimes(userId, await parsePayload(OnboardingTimesDto, op.payload));
    return APPLIED;
  }

  private async finish({ userId, op }: SyncOpContext): Promise<SyncOpOutcome> {
    const dto = await parsePayload(SyncOnboardingFinishDto, op.payload);
    const done = await this.prisma.sportProfile.findUnique({
      where: { userId },
      select: { onboardedAt: true },
    });
    // Настройку закончили в боте или вебе, пока телефон был без сети. rejected сбросит курсор:
    // полный pull уберёт программу, заведённую телефоном, и вернёт выбранную там
    if (done?.onboardedAt) {
      this.logger.warn(`Офлайн-настройка после уже законченной: userId=${userId}`);
      return { status: 'rejected', reason: 'Настройка уже закончена на другом устройстве' };
    }
    await this.onboarding.finish(userId, dto, {
      program: dto.programClientId,
      complexes: new Map(dto.complexes.map((c) => [c.sourceId, c.clientId])),
      items: new Map(dto.items.map((i) => [i.sourceId, i.clientId])),
    });
    const program = await this.prisma.program.findFirst({
      where: { clientId: dto.programClientId, ownerId: userId },
      select: { id: true },
    });
    return { status: 'applied', ids: program ? { [dto.programClientId]: program.id } : undefined };
  }
}
