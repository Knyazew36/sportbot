import { Module } from '@nestjs/common';

import { ProgramTagController } from './program-tag.controller';
import { ProgramTagService } from './program-tag.service';

@Module({
  controllers: [ProgramTagController],
  providers: [ProgramTagService],
})
export class ProgramTagModule {}
