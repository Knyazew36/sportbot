import { DynamicModule, Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';

import { TelegramAuthStrategy } from './auth/telegram-auth.strategy';
import { TelegramBotService } from './bot/telegram-bot.service';
import { TelegramBotUpdate } from './bot/telegram-bot.update';
import { TelegramController } from './controller/telegram.controller';
import { TelegramLinkService } from './deeplink/telegram-link.service';
import { TelegramLoginService } from './deeplink/telegram-login.service';
import { TelegramDialogService } from './dialog/telegram-dialog.service';
import { TelegramHostAuthGuard } from './guards/telegram-host-auth.guard';
import { TelegramMessengerChannel } from './messenger/telegram-messenger.channel';
import { TelegramAppAdapter } from './telegram-app.adapter';
import {
  TELEGRAM_HOST_AUTH_GUARD,
  TELEGRAM_INTEGRATION_OPTIONS,
} from './telegram.constants';
import { TelegramIntegrationOptions } from './telegram.types';

/**
 * Всё про Telegram в одном модуле: бот, авторизация мини-приложения по initData, вход в веб через
 * бота, привязка Telegram к веб-аккаунту, учёт «может ли бот писать» для уведомлений.
 * Устроен так же, как модуль MAX (src/messengers/max, см. README.md там).
 *
 * Требует подключённого MessengersModule (src/messengers): модуль регистрирует там канал 'TELEGRAM'.
 *
 * Модуль глобальный: TelegramBotService / TelegramDialogService / TelegramAuthStrategy можно
 * инжектить в любом модуле проекта без импорта TelegramIntegrationModule.
 */
@Module({})
export class TelegramIntegrationModule {
  public static forRoot(options: TelegramIntegrationOptions): DynamicModule {
    return {
      module: TelegramIntegrationModule,
      global: true,
      imports: [
        TelegrafModule.forRoot({
          token: options.token,
          // Polling запускает TelegramBotService сам, с логом и ретраем (см. onApplicationBootstrap)
          launchOptions: false,
          // Без include nestjs-telegraf ищет @Update во всех модулях — ограничиваемся своим
          include: [TelegramIntegrationModule],
        }),
        ...(options.imports ?? []),
      ],
      controllers: [TelegramController],
      providers: [
        { provide: TELEGRAM_INTEGRATION_OPTIONS, useValue: options },
        { provide: TelegramAppAdapter, useClass: options.adapter },
        { provide: TELEGRAM_HOST_AUTH_GUARD, useClass: options.authGuard },
        TelegramHostAuthGuard,
        TelegramAuthStrategy,
        TelegramDialogService,
        TelegramBotService,
        TelegramBotUpdate,
        TelegramLoginService,
        TelegramLinkService,
        // Канал 'TELEGRAM' для общего слоя мессенджеров (src/messengers) — регистрируется в MessengerRegistry сам
        TelegramMessengerChannel,
      ],
      exports: [
        TelegramAuthStrategy,
        TelegramDialogService,
        TelegramBotService,
        TelegramMessengerChannel,
      ],
    };
  }
}
