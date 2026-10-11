import { Module } from '@nestjs/common';

import { UploadModule } from '../upload/upload.module';
import { NotificationsModule } from '@/notifications/notifications.module';

import { InviteController } from './invite.controller';
import { InviteService } from './invite.service';

@Module({
  imports: [UploadModule, NotificationsModule],
  controllers: [InviteController],
  providers: [InviteService],
  exports: [InviteService],
})
export class InviteModule {}
