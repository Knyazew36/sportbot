import { Module } from '@nestjs/common';

import { ProfileModule } from '@/profile/profile.module';

import { LinkBot } from './link.bot';
import { LinkService } from './link.service';

/** Привязка второго мессенджера к аккаунту (Б15а). */
@Module({
  imports: [ProfileModule],
  providers: [LinkService, LinkBot],
})
export class LinkModule {}
