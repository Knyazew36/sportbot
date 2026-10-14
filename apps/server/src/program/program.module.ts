import { Module } from '@nestjs/common';

import { CatalogModule } from '@/catalog/catalog.module';

import { ProgramAppService } from './program-app.service';
import { ProgramBot } from './program.bot';
import { ProgramController } from './program.controller';
import { ProgramService } from './program.service';

@Module({
  imports: [CatalogModule],
  controllers: [ProgramController],
  providers: [ProgramService, ProgramAppService, ProgramBot],
  exports: [ProgramService, ProgramAppService],
})
export class ProgramModule {}
