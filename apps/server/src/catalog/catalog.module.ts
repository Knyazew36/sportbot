import { Module } from '@nestjs/common';

import { CatalogBot } from './catalog.bot';
import { CatalogService } from './catalog.service';

@Module({
  providers: [CatalogService, CatalogBot],
  exports: [CatalogService],
})
export class CatalogModule {}
