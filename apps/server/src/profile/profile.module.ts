import { Module } from '@nestjs/common';

import { AvatarModule } from '@/avatar/avatar.module';
import { ProgramModule } from '@/program/program.module';
import { UploadModule } from '@/upload/upload.module';

import { ProfileAppService } from './profile-app.service';
import { ProfileBot } from './profile.bot';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [ProgramModule, AvatarModule, UploadModule],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileAppService, ProfileBot],
  exports: [ProfileService],
})
export class ProfileModule {}
