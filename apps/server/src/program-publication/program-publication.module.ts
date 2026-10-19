import { Module } from '@nestjs/common';

import { ModerationModule } from '@/moderation/moderation.module';

import { AdminProgramReviewController } from './admin-program-review.controller';
import { ProgramPublicationService } from './program-publication.service';

@Module({
  imports: [ModerationModule],
  controllers: [AdminProgramReviewController],
  providers: [ProgramPublicationService],
  exports: [ProgramPublicationService],
})
export class ProgramPublicationModule {}
