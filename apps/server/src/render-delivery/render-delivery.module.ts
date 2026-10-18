import { Module } from '@nestjs/common';

import { UploadModule } from '@/upload/upload.module';

import { RenderDeliveryService } from './render-delivery.service';

/** Готовые ролики с доставкой CHAT — ботом в мессенджер, откуда открыто приложение. */
@Module({
  imports: [UploadModule],
  providers: [RenderDeliveryService],
})
export class RenderDeliveryModule {}
