import { Module } from '@nestjs/common';

import { CatalogModule } from '@/catalog/catalog.module';

import { DraftAppService } from './draft-app.service';
import { DraftBot } from './draft.bot';
import { DraftController } from './draft.controller';
import { ModerationBot } from './moderation.bot';
import { ModerationService } from './moderation.service';

@Module({
  imports: [CatalogModule],
  controllers: [DraftController],
  providers: [ModerationService, DraftAppService, DraftBot, ModerationBot],
  exports: [ModerationService],
})
export class ModerationModule {}
