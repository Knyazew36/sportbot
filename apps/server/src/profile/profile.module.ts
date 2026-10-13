import { Module } from '@nestjs/common';

import { ProgramModule } from '@/program/program.module';

import { ProfileBot } from './profile.bot';
import { ProfileService } from './profile.service';

@Module({
  imports: [ProgramModule],
  providers: [ProfileService, ProfileBot],
  exports: [ProfileService],
})
export class ProfileModule {}
