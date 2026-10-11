import { Module } from '@nestjs/common';

import { UploadModule } from '../upload/upload.module';
import { NotificationsModule } from '@/notifications/notifications.module';

import { JoinRequestController } from './join-request.controller';
import { JoinRequestService } from './join-request.service';

@Module({
  imports: [UploadModule, NotificationsModule],
  controllers: [JoinRequestController],
  providers: [JoinRequestService],
  exports: [JoinRequestService],
})
export class JoinRequestModule {}
