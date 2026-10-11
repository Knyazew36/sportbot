import { DynamicModule, Module } from '@nestjs/common';
import { MaxModule as NestjsMaxModule } from 'nestjs-max';

import { MaxAuthStrategy } from './auth/max-auth.strategy';
import { MaxBotService } from './bot/max-bot.service';
import { MaxBotUpdate } from './bot/max-bot.update';
import { MaxController } from './controller/max.controller';
import { MaxLinkService } from './deeplink/max-link.service';
import { MaxLoginService } from './deeplink/max-login.service';
import { MaxDialogService } from './dialog/max-dialog.service';
import { MaxHostAuthGuard } from './guards/max-host-auth.guard';
import { MaxAppAdapter } from './max-app.adapter';
import { MAX_HOST_AUTH_GUARD, MAX_INTEGRATION_OPTIONS } from './max.constants';
import { MaxIntegrationOptions } from './max.types';
import { MaxMessengerChannel } from './messenger/max-messenger.channel';

/**
 * Всё про мессенджер MAX в одном модуле: бот, авторизация мини-приложения по initData,
 * вход в веб через бота, привязка MAX к веб-аккаунту, состояние чата для уведомлений.
 * Подключение и контракт с проектом — в README.md рядом.
 *
 * Требует подключённого MessengersModule (src/messengers): модуль регистрирует там канал 'MAX'.
 *
 * Модуль глобальный: MaxBotService / MaxDialogService / MaxAuthStrategy можно инжектить
 * в любом модуле проекта без импорта MaxIntegrationModule.
 */
@Module({})
export class MaxIntegrationModule {
  public static forRoot(options: MaxIntegrationOptions): DynamicModule {
    return {
      module: MaxIntegrationModule,
      global: true,
      imports: [
        NestjsMaxModule.forRoot({
          token: options.token,
          replyOptions: { markup: 'html' },
          // Polling запускает MaxBotService сам, с логом и ретраем (см. onApplicationBootstrap)
          launchOptions: false,
        }),
        ...(options.imports ?? []),
      ],
      controllers: [MaxController],
      providers: [
        { provide: MAX_INTEGRATION_OPTIONS, useValue: options },
        { provide: MaxAppAdapter, useClass: options.adapter },
        { provide: MAX_HOST_AUTH_GUARD, useClass: options.authGuard },
        MaxHostAuthGuard,
        MaxAuthStrategy,
        MaxDialogService,
        MaxBotService,
        MaxBotUpdate,
        MaxLoginService,
        MaxLinkService,
        // Канал 'MAX' для общего слоя мессенджеров (src/messengers) — регистрируется в MessengerRegistry сам
        MaxMessengerChannel,
      ],
      exports: [
        MaxAuthStrategy,
        MaxDialogService,
        MaxBotService,
        MaxMessengerChannel,
      ],
    };
  }
}
