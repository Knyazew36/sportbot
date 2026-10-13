import { Module } from '@nestjs/common';

import { CatalogModule } from '@/catalog/catalog.module';

import { LimitationBot } from './limitation.bot';
import { LimitationService } from './limitation.service';

@Module({
  imports: [CatalogModule],
  providers: [LimitationService, LimitationBot],
  exports: [LimitationService],
})
export class LimitationModule {}
