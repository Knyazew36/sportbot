import { Module } from '@nestjs/common';

import { AvatarModule } from '@/avatar/avatar.module';
import { CatalogModule } from '@/catalog/catalog.module';
import { UploadModule } from '@/upload/upload.module';

import { SyncCatalogService } from './sync-catalog.service';
import { SyncPullService } from './sync-pull.service';
import { SyncPushService } from './sync-push.service';
import { SyncController } from './sync.controller';

@Module({
  imports: [AvatarModule, CatalogModule, UploadModule],
  controllers: [SyncController],
  providers: [SyncPullService, SyncPushService, SyncCatalogService],
  exports: [SyncPushService],
})
export class SyncModule {}
