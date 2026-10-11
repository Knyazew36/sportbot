import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';
import { getCorsConfig } from './common';
import { getSwaggerConfig } from './common/config/swagger.config';
import { AllExceptionsFilter } from './common/fitlers/exception.filter';
import { UploadService } from './upload/upload.service';

// Загружаем правильный .env файл в зависимости от NODE_ENV
// const envFile =
//   process.env.NODE_ENV === 'production'
//     ? '.env.production'
//     : '.env.development';
// config({ path: path.resolve(process.cwd(), envFile) });

// nestjs-telegraf вызывает bot.launch() без await/catch, поэтому таймаут getMe
// к api.telegram.org (ETIMEDOUT) прилетает как unhandledRejection и роняет процесс.
// Логируем такие ошибки, но не завершаем приложение — API должно работать даже без Telegram.
process.on('unhandledRejection', (reason: any) => {
  console.error(
    '⚠️ Unhandled promise rejection (процесс не завершаем):',
    reason,
  );
});
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // За приложением ровно один reverse proxy (nginx) — доверяем один хоп, чтобы
  // req.ip брался из X-Forwarded-For, а не был всегда адресом самого nginx.
  // Без этого ThrottlerGuard (по умолчанию трекает по req.ip) считает лимит
  // не per-client, а суммарно на всё приложение — см. guest-login DoS.
  app.set('trust proxy', 1);

  const config = app.get(ConfigService);
  const port = process.env.PORT || 4003;

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
  // каждый такой запрос падает в AllExceptionsFilter как NotFoundException и спамит error-логи.
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

  // Раздача загруженных аватаров через уже существующий nginx location /api/ —
  // без правок nginx.conf (деплой их не подхватывает без ручного SSH-шага)
  const uploadService = app.get(UploadService);
  app.useStaticAssets(uploadService.getCategoryDir('avatars'), {
    prefix: '/api/uploads/avatars',
  });

  const winstonLogger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(winstonLogger);
  // app.use(cookieParser());

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
      // forbidNonWhitelisted: true, // Ошибка при передаче неописанных полей — сломает существующих клиентов
      transform: true, // Автоматически преобразует входные данные к типу DTO
    }),
  );

  try {
    await app.listen(port);

    winstonLogger.log(`🚀 Server is running, http://localhost:${port}`);
    winstonLogger.log(`⚙️ NODE_ENV=${process.env.NODE_ENV}`);
  } catch (error) {
    winstonLogger.error(
      `🚨 Server is not running: http://localhost:${port} ${error}`,
    );
    process.exit(1);
  }
}
bootstrap();
