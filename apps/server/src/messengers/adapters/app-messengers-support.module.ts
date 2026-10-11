import { Injectable, Module, OnModuleInit, Optional } from '@nestjs/common';

import { AuthStrategyRegistry } from '@/common/auth-strategy.registry';
import { AuthStrategy } from '@/common/strategies/auth-strategies.type';
import { User } from '@/generated/prisma/client';
import { MaxAuthStrategy } from '@/messengers/max';
import { TelegramAuthStrategy } from '@/messengers/telegram';
import { VkAuthStrategy } from '@/messengers/vk';
import { UserModule } from '@/user/user.module';

import { AppMessengerAccountsService } from './app-messenger-accounts.service';

/**
 * Подключает стратегии мини-приложений (Authorization: tma/max/vk …) к MultiAuthGuard проекта.
 * Стратегии живут в модулях мессенджеров и ничего не знают про AuthStrategyRegistry — связывает их
 * этот класс. Мессенджер не подключён (нет env) — его стратегии нет, @Optional даёт undefined.
 */
@Injectable()
export class MessengerAuthStrategiesRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: AuthStrategyRegistry,
    @Optional() private readonly telegram?: TelegramAuthStrategy,
    @Optional() private readonly max?: MaxAuthStrategy,
    @Optional() private readonly vk?: VkAuthStrategy,
  ) {}

  public onModuleInit(): void {
    for (const strategy of [this.telegram, this.max, this.vk]) {
      if (!strategy) continue;
      this.registry.register({
        provider: strategy.provider,
        supports: (req) => strategy.supports(req),
        // PrismaMessengerUserStore отдаёт полные строки User — стратегия возвращает их же
        authenticate: (req) => strategy.authenticate(req) as Promise<User>,
      } satisfies AuthStrategy);
    }
  }
}

/**
 * Проектная обвязка мессенджеров: логика аккаунтов для адаптеров и регистрация стратегий
 * мини-приложений. Импортируется в app.module.ts и передаётся в imports каждого *IntegrationModule
 * (см. app-messengers.ts), чтобы адаптеры могли инжектить AppMessengerAccountsService.
 */
@Module({
  imports: [UserModule],
  providers: [AppMessengerAccountsService, MessengerAuthStrategiesRegistrar],
  exports: [AppMessengerAccountsService],
})
export class AppMessengersSupportModule {}
