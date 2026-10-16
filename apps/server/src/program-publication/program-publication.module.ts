import { Module } from '@nestjs/common';

import { AdminProgramReviewController } from './admin-program-review.controller';
import { ProgramPublicationService } from './program-publication.service';

@Module({
  controllers: [AdminProgramReviewController],
  providers: [ProgramPublicationService],
  exports: [ProgramPublicationService],
})
export class ProgramPublicationModule {}
