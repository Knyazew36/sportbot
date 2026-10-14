import { Module } from '@nestjs/common';

import { UploadModule } from '@/upload/upload.module';

import { CatalogAppService } from './catalog-app.service';
import { CatalogBot } from './catalog.bot';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [UploadModule],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogAppService, CatalogBot],
  exports: [CatalogService],
})
export class CatalogModule {}
