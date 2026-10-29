import { Module } from '@nestjs/common';

import { ProgramModule } from '@/program/program.module';
import { SyncModule } from '@/sync/sync.module';

import { OnboardingController } from './onboarding.controller';
import { OnboardingSyncService } from './onboarding-sync.service';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [ProgramModule, SyncModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingSyncService],
})
export class OnboardingModule {}
