import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';

import { PrismaModule, validateEnv, winstonConfig } from '@/common';
import { UploadModule } from '@/upload/upload.module';

import { RenderWorkerService } from './render-worker.service';

/**
 * Корень процесса рендера (src/main-render.ts). Только БД, файлы и расписание — без HTTP и
 * ботов: их второй экземпляр конфликтовал бы с основным процессом.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      validate: validateEnv,
    }),
    WinstonModule.forRoot(winstonConfig),
    ScheduleModule.forRoot(),
    PrismaModule,
    UploadModule,
  ],
  providers: [RenderWorkerService],
})
export class RenderWorkerModule {}
