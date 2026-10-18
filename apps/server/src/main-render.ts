// Процесс рендера видео: pm2 start dist/src/main-render.js --name render
// (локально — yarn start:render). Задачи ставит API, доставляет в чат основной процесс
import 'dotenv/config';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { RenderWorkerModule } from './render-worker/render-worker.module';

const processLogger = new Logger('🎞️ Render');
process.on('unhandledRejection', (reason: unknown) => {
  processLogger.error(
    `Unhandled promise rejection: ${reason instanceof Error ? reason.message : String(reason)}`,
    reason instanceof Error ? reason.stack : undefined,
  );
});

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(RenderWorkerModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.enableShutdownHooks();
}
void bootstrap();
