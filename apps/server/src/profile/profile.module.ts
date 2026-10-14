import { Module } from '@nestjs/common';

import { ProgramModule } from '@/program/program.module';

import { ProfileAppService } from './profile-app.service';
import { ProfileBot } from './profile.bot';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [ProgramModule],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileAppService, ProfileBot],
  exports: [ProfileService],
})
export class ProfileModule {}
