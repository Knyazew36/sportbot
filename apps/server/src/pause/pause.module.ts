import { Module } from '@nestjs/common';

import { PlanModule } from '@/plan/plan.module';

import { PauseBot } from './pause.bot';
import { PauseController } from './pause.controller';
import { PauseService } from './pause.service';

@Module({
  imports: [PlanModule],
  controllers: [PauseController],
  providers: [PauseService, PauseBot],
  exports: [PauseService],
})
export class PauseModule {}
