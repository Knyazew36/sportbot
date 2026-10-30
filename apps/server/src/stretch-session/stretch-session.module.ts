import { Module } from '@nestjs/common';

import { SyncModule } from '@/sync/sync.module';

import { StretchSessionController } from './stretch-session.controller';
import { StretchSessionSyncService } from './stretch-session-sync.service';
import { StretchSessionService } from './stretch-session.service';

@Module({
  imports: [SyncModule],
  controllers: [StretchSessionController],
  providers: [StretchSessionService, StretchSessionSyncService],
})
export class StretchSessionModule {}
