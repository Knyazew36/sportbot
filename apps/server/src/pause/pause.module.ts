import { Module } from '@nestjs/common';

import { PlanModule } from '@/plan/plan.module';

import { PauseBot } from './pause.bot';
import { PauseService } from './pause.service';

@Module({
  imports: [PlanModule],
  providers: [PauseService, PauseBot],
  exports: [PauseService],
})
export class PauseModule {}
