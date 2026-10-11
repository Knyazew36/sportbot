import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthStrategyRegistry } from './auth-strategy.registry';
import { getJwtConfig } from './config/jwt.config';
import { MultiAuthGuard } from './guards/multi-auth.guard';
import { JwtAuthStrategy } from './strategies/jwt-auth.strategy';
// Стратегии мини-приложений Telegram/MAX/VK подключаются из своих messengers/*-integration.module.ts
// (только если заданы их env) и регистрируются в AuthStrategyRegistry сами — этот модуль не меняется.

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJwtConfig,
    }),
  ],
  providers: [AuthStrategyRegistry, JwtAuthStrategy, MultiAuthGuard],
  exports: [AuthStrategyRegistry, JwtAuthStrategy, MultiAuthGuard, JwtModule],
})
export class MultiAuthModule {}
