import { Module } from '@nestjs/common';

import { UploadModule } from '@/upload/upload.module';

import { RenderCleanupService } from './render-cleanup.service';
import { RenderController } from './render.controller';
import { RenderService } from './render.service';

/** API очереди рендера. Рендерит отдельный процесс (src/render-worker), в чат шлёт src/render-delivery. */
@Module({
  imports: [UploadModule],
  controllers: [RenderController],
  providers: [RenderService, RenderCleanupService],
})
export class RenderModule {}
