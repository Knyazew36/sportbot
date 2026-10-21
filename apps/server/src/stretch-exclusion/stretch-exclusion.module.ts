import { Module } from '@nestjs/common';

import { UploadModule } from '@/upload/upload.module';

import { StretchExclusionController } from './stretch-exclusion.controller';
import { StretchExclusionService } from './stretch-exclusion.service';

@Module({
  imports: [UploadModule],
  controllers: [StretchExclusionController],
  providers: [StretchExclusionService],
  exports: [StretchExclusionService],
})
export class StretchExclusionModule {}
