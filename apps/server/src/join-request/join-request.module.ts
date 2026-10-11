import { Module } from '@nestjs/common'

import { UploadModule } from '../upload/upload.module'
import { VkModule } from '../vk/vk.module'

import { JoinRequestController } from './join-request.controller'
import { JoinRequestService } from './join-request.service'

@Module({
  imports: [UploadModule, VkModule],
  controllers: [JoinRequestController],
  providers: [JoinRequestService],
  exports: [JoinRequestService],
})
export class JoinRequestModule {}
