import { Module } from '@nestjs/common';

import { ProgramModule } from '@/program/program.module';

import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [ProgramModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
