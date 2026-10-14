import { Module } from '@nestjs/common';

import { ProfileModule } from '@/profile/profile.module';

import { LinkAppService } from './link-app.service';
import { LinkBot } from './link.bot';
import { LinkController } from './link.controller';
import { LinkService } from './link.service';

/** Привязка второго мессенджера к аккаунту (Б15а). */
@Module({
  imports: [ProfileModule],
  controllers: [LinkController],
  providers: [LinkService, LinkAppService, LinkBot],
})
export class LinkModule {}
