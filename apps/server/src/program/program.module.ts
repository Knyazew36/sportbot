import { Module } from '@nestjs/common';

import { CatalogModule } from '@/catalog/catalog.module';
import { ProgramTagModule } from '@/program-tag/program-tag.module';

import { ProgramAppService } from './program-app.service';
import { ProgramBot } from './program.bot';
import { ProgramController } from './program.controller';
import { ProgramService } from './program.service';

@Module({
  imports: [CatalogModule, ProgramTagModule],
  controllers: [ProgramController],
  providers: [ProgramService, ProgramAppService, ProgramBot],
  exports: [ProgramService, ProgramAppService],
})
export class ProgramModule {}
