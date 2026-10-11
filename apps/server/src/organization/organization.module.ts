import { Module } from '@nestjs/common'

import { UploadModule } from '../upload/upload.module'
import { VkModule } from '../vk/vk.module'

import { OrganizationController } from './organization.controller'
import { OrganizationService } from './organization.service'

@Module({
  imports: [UploadModule, VkModule],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
