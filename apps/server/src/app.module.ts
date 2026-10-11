import { Module } from '@nestjs/common';
import { CaslModule } from './common/casl';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import {
  GuardsModule,
  MultiAuthModule,
  PrismaModule,
  validateEnv,
  winstonConfig,
} from './common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './common/interseptors/response.interceptor';
import { OrganizationTrialInterceptor } from './common/interseptors/organization-trial.interceptor';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { InviteModule } from './invite/invite.module';
import { JoinRequestModule } from './join-request/join-request.module';
import { OrganizationModule } from './organization/organization.module';
import { LessonModule } from './lesson/lesson.module';
import { GroupModule } from './group/group.module';

import { ScheduleRuleModule } from './schedule-rule/schedule-rule.module';
import { UploadModule } from './upload/upload.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { VkModule } from './vk/vk.module';
import { NotificationModule } from './notification/notification.module';
import { ChatModule } from './chat/chat.module';
import { MaxModule } from 'nestjs-max';
import { MessengersModule } from './messengers';
import { messengerIntegrations } from './messengers/app-messengers';
import { NotificationsModule } from './notifications/notifications.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      ignoreEnvFile: false,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    MaxModule.forRoot({
      token: process.env.MAX_BOT_TOKEN!,
      replyOptions: { markup: 'html' },
      // Библиотека сама вызывает bot.start() без await/catch — падение (напр. невалидный
      // токен) улетает в unhandledRejection и убивает polling молча, без ретрая. Запускаем
      // и следим за этим сами — см. BotMaxService.onApplicationBootstrap.
      launchOptions: false,
    }),

    WinstonModule.forRoot(winstonConfig),
    PrismaModule,
    GuardsModule,
    CaslModule,
    MultiAuthModule,
    ScheduleModule.forRoot(),
    AuthModule,
    MailModule,
    UserModule,
    AdminModule,
    OrganizationModule,
    InviteModule,
    JoinRequestModule,
    ScheduleRuleModule,
    LessonModule,
    GroupModule,
    UploadModule,
    VkModule,
    NotificationModule,
    ChatModule,
    MessengersModule,
    NotificationsModule,
    ...messengerIntegrations(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: OrganizationTrialInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
