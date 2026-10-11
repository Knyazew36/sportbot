// Первым импортом: часть настроек читается из process.env при загрузке модулей (лимит размера файла
// в декораторах контроллеров) — раньше, чем ConfigModule успевает прочитать .env
import 'dotenv/config';

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';
import { getCorsConfig } from './common';
import { getSwaggerConfig } from './common/config/swagger.config';
import { AllExceptionsFilter } from './common/filters/exception.filter';
import { UploadService } from './upload/upload.service';

// nestjs-telegraf вызывает bot.launch() без await/catch, поэтому таймаут getMe
// к api.telegram.org (ETIMEDOUT) прилетает как unhandledRejection и роняет процесс.
// Логируем такие ошибки, но не завершаем приложение — API должно работать даже без Telegram.
const processLogger = new Logger('⚙️ Process');
process.on('unhandledRejection', (reason: unknown) => {
  processLogger.error(
    `Unhandled promise rejection (процесс не завершаем): ${reason instanceof Error ? reason.message : String(reason)}`,
    reason instanceof Error ? reason.stack : undefined,
  );
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // За приложением ровно один reverse proxy (nginx) — доверяем один хоп, чтобы
  // req.ip брался из X-Forwarded-For, а не был всегда адресом самого nginx.
  // Без этого ThrottlerGuard (по умолчанию трекает по req.ip) считает лимит
  // не per-client, а суммарно на всё приложение.
  app.set('trust proxy', 1);

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 4003);

  app.use(
    helmet({
      // Чистый JSON API, HTML не отдаём — CSP тут не про что защищать, а Swagger UI
      // на /api/docs требует inline-скриптов/стилей, дефолтный CSP их сломает.
      contentSecurityPolicy: false,
      // /api/uploads/* грузятся <img> с фронтового домена (другой origin) — дефолтный
      // same-origin CORP их заблокирует в браузере.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors(getCorsConfig(config));

  app.setGlobalPrefix('api');

  // Боты долбят /favicon.ico и /robots.txt в корень API-домена — без этого
  // каждый такой запрос падает в AllExceptionsFilter как NotFoundException и спамит логи.
  app
    .getHttpAdapter()
    .getInstance()
    .get('/favicon.ico', (_req: any, res: any) => res.status(204).end());
  app
    .getHttpAdapter()
    .getInstance()
    .get('/robots.txt', (_req: any, res: any) =>
      res.status(200).type('text/plain').send('User-agent: *\nDisallow: /\n'),
    );

  // Раздача загруженных файлов через уже существующий nginx location /api/ — без правок nginx.conf.
  // Отдаются только перечисленные категории: имена файлов — случайные uuid, списка каталога нет.
  const uploadService = app.get(UploadService);
  for (const category of UploadService.PUBLIC_CATEGORIES) {
    app.useStaticAssets(uploadService.getCategoryDir(category), {
      prefix: `/api/uploads/${category}`,
    });
  }

  const winstonLogger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(winstonLogger);

  // Swagger — источник OpenAPI-схемы для orval (генерация react-query хуков на фронте).
  // ignoreGlobalPrefix, т.к. фронт сам добавляет /api через apiDomain при вызове запросов.
  const swaggerDocument = SwaggerModule.createDocument(
    app,
    getSwaggerConfig(),
    { ignoreGlobalPrefix: true },
  );
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Удаляет неописанные в DTO поля
      transform: true, // Автоматически преобразует входные данные к типу DTO
    }),
  );

  try {
    await app.listen(port);

    winstonLogger.log(`🚀 Server is running, http://localhost:${port}`);
    winstonLogger.log(`⚙️ NODE_ENV=${config.get<string>('NODE_ENV')}`);
  } catch (error) {
    winstonLogger.error(
      `🚨 Server is not running: http://localhost:${port} ${error}`,
    );
    process.exit(1);
  }
}
void bootstrap();
