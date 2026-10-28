import { Module } from '@nestjs/common';
import { SyncModule } from '@/sync/sync.module';

import { AvatarModule } from '@/avatar/avatar.module';
import { CatalogModule } from '@/catalog/catalog.module';
import { ProgramPublicationModule } from '@/program-publication/program-publication.module';
import { ProgramTagModule } from '@/program-tag/program-tag.module';

import { ProgramSyncService } from './program-sync.service';
import { ProgramAppService } from './program-app.service';
import { ProgramBot } from './program.bot';
import { ProgramController } from './program.controller';
import { ProgramService } from './program.service';

@Module({
  imports: [
    AvatarModule,
    CatalogModule,
    ProgramPublicationModule,
    ProgramTagModule,
    SyncModule,
  ],
  controllers: [ProgramController],
  providers: [ProgramService, ProgramAppService, ProgramSyncService, ProgramBot],
  exports: [ProgramService, ProgramAppService],
})
export class ProgramModule {}
