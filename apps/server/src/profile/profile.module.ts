import { Module } from '@nestjs/common';

import { AvatarModule } from '@/avatar/avatar.module';
import { ProgramModule } from '@/program/program.module';
import { SyncModule } from '@/sync/sync.module';
import { UploadModule } from '@/upload/upload.module';

import { ProfileAppService } from './profile-app.service';
import { ProfileSyncService } from './profile-sync.service';
import { ProfileBot } from './profile.bot';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [ProgramModule, AvatarModule, UploadModule, SyncModule],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileAppService, ProfileSyncService, ProfileBot],
  exports: [ProfileService],
})
export class ProfileModule {}
