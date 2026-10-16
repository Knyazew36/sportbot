import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import {
  GuardsModule,
  MultiAuthModule,
  PrismaModule,
  validateEnv,
  winstonConfig,
} from './common';
import { CaslModule } from './common/casl';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { InviteModule } from './invite/invite.module';
import { JoinRequestModule } from './join-request/join-request.module';
import { MailModule } from './mail/mail.module';
import { MessengersModule } from './messengers';
import { AppMessengersSupportModule } from './messengers/adapters/app-messengers-support.module';
import { PrismaMessengerUserStore } from './messengers/adapters/prisma-messenger-user.store';
import { messengerIntegrations } from './messengers/app-messengers';
import { NotificationsModule } from './notifications/notifications.module';
import { OrganizationModule } from './organization/organization.module';
import { UploadModule } from './upload/upload.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { BodyWeightModule } from './body-weight/body-weight.module';
import { BotModule } from './bot';
import { CatalogModule } from './catalog/catalog.module';
import { LimitationModule } from './limitation/limitation.module';
import { LinkModule } from './link/link.module';
import { MiniappModule } from './miniapp/miniapp.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { DayModule } from './day/day.module';
import { ModerationModule } from './moderation/moderation.module';
import { PauseModule } from './pause/pause.module';
import { PlanPollModule } from './plan/plan-poll.module';
import { PlanModule } from './plan/plan.module';
import { ProfileModule } from './profile/profile.module';
import { ProgramModule } from './program/program.module';
import { ProgramTagModule } from './program-tag/program-tag.module';
import { SocialModule } from './social/social.module';
import { StarsModule } from './stars/stars.module';
import { StatsModule } from './stats/stats.module';
import { WorkoutModule } from './workout/workout.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      ignoreEnvFile: false,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    WinstonModule.forRoot(winstonConfig),
    ScheduleModule.forRoot(),

    PrismaModule,
    GuardsModule,
    CaslModule,
    MultiAuthModule,

    // Общий слой мессенджеров: реестр каналов для уведомлений и хранилище пользователей (src/messengers)
    MessengersModule.forRoot({ userStore: PrismaMessengerUserStore }),
    // Ядро бота: роутер и очередь отправки нужны адаптерам мессенджеров
    BotModule,
    AppMessengersSupportModule,
    // MAX / Telegram / VK — только те, для которых заданы env-переменные (иначе лог и старт без них)
    ...messengerIntegrations(),

    AuthModule,
    MailModule,
    UploadModule,
    UserModule,
    OrganizationModule,
    InviteModule,
    JoinRequestModule,
    NotificationsModule,
    AuditLogModule,
    ChatModule,

    // Спортбот (business-tz.md, раздел 23.1)
    ProfileModule,
    MiniappModule,
    OnboardingModule,
    DayModule,
    CatalogModule,
    ModerationModule,
    ProgramModule,
    ProgramTagModule,
    WorkoutModule,
    PlanModule,
    PlanPollModule,
    PauseModule,
    LimitationModule,
    BodyWeightModule,
    StarsModule,
    StatsModule,
    SocialModule,
    LinkModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
