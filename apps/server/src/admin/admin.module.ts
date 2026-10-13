import { Module } from '@nestjs/common';

import { ModerationModule } from '@/moderation/moderation.module';

import { AdminBot } from './admin.bot';
import { AdminService } from './admin.service';
import { ImportService } from './import.service';

@Module({
  imports: [ModerationModule],
  providers: [AdminService, ImportService, AdminBot],
  exports: [ImportService],
})
export class AdminModule {}
