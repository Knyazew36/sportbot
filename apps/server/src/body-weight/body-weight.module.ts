import { Module } from '@nestjs/common';

import { SyncModule } from '@/sync/sync.module';

import { BodyWeightBot } from './body-weight.bot';
import { BodyWeightController } from './body-weight.controller';
import { BodyWeightSyncService } from './body-weight-sync.service';
import { BodyWeightService } from './body-weight.service';

@Module({
  imports: [SyncModule],
  controllers: [BodyWeightController],
  providers: [BodyWeightService, BodyWeightSyncService, BodyWeightBot],
  exports: [BodyWeightService],
})
export class BodyWeightModule {}
