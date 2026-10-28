import { Module } from '@nestjs/common';

import { PlanModule } from '@/plan/plan.module';
import { SyncModule } from '@/sync/sync.module';

import { PauseBot } from './pause.bot';
import { PauseController } from './pause.controller';
import { PauseSyncService } from './pause-sync.service';
import { PauseService } from './pause.service';

@Module({
  imports: [PlanModule, SyncModule],
  controllers: [PauseController],
  providers: [PauseService, PauseSyncService, PauseBot],
  exports: [PauseService],
})
export class PauseModule {}
