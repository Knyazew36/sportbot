import { Module } from '@nestjs/common';

import { CatalogModule } from '@/catalog/catalog.module';
import { ModerationModule } from '@/moderation/moderation.module';
import { ProgramModule } from '@/program/program.module';
import { UploadModule } from '@/upload/upload.module';

import { AdminAppService } from './admin-app.service';
import { AdminCatalogController } from './admin-catalog.controller';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminTemplatesController } from './admin-templates.controller';
import { AdminBot } from './admin.bot';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ImportService } from './import.service';

@Module({
  imports: [ModerationModule, CatalogModule, ProgramModule, UploadModule],
  controllers: [
    AdminController,
    AdminCatalogController,
    AdminTemplatesController,
  ],
  providers: [
    AdminService,
    AdminAppService,
    AdminCatalogService,
    ImportService,
    AdminBot,
  ],
  exports: [ImportService],
})
export class AdminModule {}
