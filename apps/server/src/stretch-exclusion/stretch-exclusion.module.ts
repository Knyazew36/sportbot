import { Module } from '@nestjs/common';

import { SyncModule } from '@/sync/sync.module';
import { UploadModule } from '@/upload/upload.module';

import { StretchExclusionController } from './stretch-exclusion.controller';
import { StretchExclusionSyncService } from './stretch-exclusion-sync.service';
import { StretchExclusionService } from './stretch-exclusion.service';

@Module({
  imports: [UploadModule, SyncModule],
  controllers: [StretchExclusionController],
  providers: [StretchExclusionService, StretchExclusionSyncService],
  exports: [StretchExclusionService],
})
export class StretchExclusionModule {}
