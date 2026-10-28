import { Module } from '@nestjs/common';

import { CatalogModule } from '@/catalog/catalog.module';
import { SyncModule } from '@/sync/sync.module';

import { LimitationBot } from './limitation.bot';
import { LimitationController } from './limitation.controller';
import { LimitationSyncService } from './limitation-sync.service';
import { LimitationService } from './limitation.service';

@Module({
  imports: [CatalogModule, SyncModule],
  controllers: [LimitationController],
  providers: [LimitationService, LimitationSyncService, LimitationBot],
  exports: [LimitationService],
})
export class LimitationModule {}
