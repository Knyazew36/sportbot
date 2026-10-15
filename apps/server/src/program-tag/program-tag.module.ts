import { Module } from '@nestjs/common';

import { ProgramTagGroupController } from './program-tag-group.controller';
import { ProgramTagGroupService } from './program-tag-group.service';
import { ProgramTagController } from './program-tag.controller';
import { ProgramTagService } from './program-tag.service';

@Module({
  controllers: [ProgramTagController, ProgramTagGroupController],
  providers: [ProgramTagService, ProgramTagGroupService],
  exports: [ProgramTagGroupService],
})
export class ProgramTagModule {}
