import { Module } from '@nestjs/common';

import { CatalogModule } from '@/catalog/catalog.module';

import { ProgramBot } from './program.bot';
import { ProgramService } from './program.service';

@Module({
  imports: [CatalogModule],
  providers: [ProgramService, ProgramBot],
  exports: [ProgramService],
})
export class ProgramModule {}
