import { Module } from '@nestjs/common';

import { CatalogModule } from '@/catalog/catalog.module';

import { LimitationBot } from './limitation.bot';
import { LimitationController } from './limitation.controller';
import { LimitationService } from './limitation.service';

@Module({
  imports: [CatalogModule],
  controllers: [LimitationController],
  providers: [LimitationService, LimitationBot],
  exports: [LimitationService],
})
export class LimitationModule {}
