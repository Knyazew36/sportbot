import { Module } from '@nestjs/common';

import { UploadModule } from '@/upload/upload.module';

import { AvatarService } from './avatar.service';

@Module({
  imports: [UploadModule],
  providers: [AvatarService],
  exports: [AvatarService],
})
export class AvatarModule {}
