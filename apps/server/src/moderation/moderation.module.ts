import { Module } from '@nestjs/common';

import { CatalogModule } from '@/catalog/catalog.module';

import { DraftBot } from './draft.bot';
import { ModerationBot } from './moderation.bot';
import { ModerationService } from './moderation.service';

@Module({
  imports: [CatalogModule],
  providers: [ModerationService, DraftBot, ModerationBot],
  exports: [ModerationService],
})
export class ModerationModule {}
