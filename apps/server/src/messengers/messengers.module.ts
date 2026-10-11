import { DynamicModule, ForwardReference, Module, Type } from '@nestjs/common';

import { MessengerRegistry } from './messenger.registry';
import { MessengerUserStore } from './messenger.types';

export interface MessengersModuleOptions {
  /** Реализация хранилища пользователей поверх БД проекта (см. MessengerUserStore). */
  userStore: Type<MessengerUserStore>;
  /** Модули, из которых userStore берёт свои зависимости, если они не глобальные. */
  imports?: Array<
    Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >;
}

/**
 * Общий слой мессенджеров: контракт MessengerChannel, реестр каналов и хранилище пользователей.
 * Глобальный — модули мессенджеров регистрируются в реестре и берут хранилище без импорта модуля.
 * Подключается один раз в app.module.ts: MessengersModule.forRoot({ userStore }).
 */
@Module({})
export class MessengersModule {
  public static forRoot(options: MessengersModuleOptions): DynamicModule {
    return {
      module: MessengersModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        MessengerRegistry,
        { provide: MessengerUserStore, useClass: options.userStore },
      ],
      exports: [MessengerRegistry, MessengerUserStore],
    };
  }
}
