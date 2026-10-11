import { Injectable, Logger } from '@nestjs/common';

import { AuthStrategy } from './strategies/auth-strategies.type';

/**
 * Реестр подключённых стратегий авторизации. Каждая стратегия регистрирует себя сама
 * (onModuleInit), MultiAuthGuard перебирает реестр и не знает заранее, какие стратегии
 * подключены — симметрично MessengerRegistry в src/messengers.
 *
 * Зачем: JwtAuthStrategy подключена всегда. Стратегии мини-приложений Telegram/MAX/VK
 * регистрируются так же из своих *IntegrationModule, только если заданы их env —
 * MultiAuthGuard при этом не меняется.
 */
@Injectable()
export class AuthStrategyRegistry {
  private readonly logger = new Logger(`🔑 ${AuthStrategyRegistry.name}`);
  private readonly strategies: AuthStrategy[] = [];

  public register(strategy: AuthStrategy): void {
    this.strategies.push(strategy);
    this.logger.log(`Подключена стратегия авторизации: ${strategy.provider}`);
  }

  public list(): AuthStrategy[] {
    return this.strategies;
  }
}
