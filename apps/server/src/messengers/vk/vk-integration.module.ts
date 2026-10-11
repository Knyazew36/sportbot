import { DynamicModule, Module } from '@nestjs/common';

import { VkApiClient } from './api/vk-api.client';
import { VkAuthStrategy } from './auth/vk-auth.strategy';
import { VkBotService } from './bot/vk-bot.service';
import { VkBotUpdate } from './bot/vk-bot.update';
import { VkLongPollService } from './bot/vk-long-poll.service';
import { VkController } from './controller/vk.controller';
import { VkLinkService } from './deeplink/vk-link.service';
import { VkLoginService } from './deeplink/vk-login.service';
import { VkDialogService } from './dialog/vk-dialog.service';
import { VkMessagesAllowedService } from './dialog/vk-messages-allowed.service';
import { VkHostAuthGuard } from './guards/vk-host-auth.guard';
import { VkMessengerChannel } from './messenger/vk-messenger.channel';
import { VkAppAdapter } from './vk-app.adapter';
import { VK_HOST_AUTH_GUARD, VK_INTEGRATION_OPTIONS } from './vk.constants';
import { VkIntegrationOptions } from './vk.types';

/**
 * Всё про VK в одном модуле: бот сообщества (Bots Long Poll), авторизация мини-приложения по
 * launch-параметрам, вход в веб через бота, привязка VK к веб-аккаунту, учёт «разрешил ли
 * пользователь сообщения» для уведомлений. Устроен так же, как модули MAX и Telegram.
 *
 * Требует подключённого MessengersModule (src/messengers): модуль регистрирует там канал 'VK'.
 *
 * Модуль глобальный: VkBotService / VkDialogService / VkAuthStrategy можно инжектить в любом
 * модуле проекта без импорта VkIntegrationModule.
 */
@Module({})
export class VkIntegrationModule {
  public static forRoot(options: VkIntegrationOptions): DynamicModule {
    return {
      module: VkIntegrationModule,
      global: true,
      imports: [...(options.imports ?? [])],
      controllers: [VkController],
      providers: [
        { provide: VK_INTEGRATION_OPTIONS, useValue: options },
        { provide: VkAppAdapter, useClass: options.adapter },
        { provide: VK_HOST_AUTH_GUARD, useClass: options.authGuard },
        VkHostAuthGuard,
        VkApiClient,
        VkAuthStrategy,
        VkDialogService,
        VkMessagesAllowedService,
        VkBotService,
        VkBotUpdate,
        VkLongPollService,
        VkLoginService,
        VkLinkService,
        // Канал 'VK' для общего слоя мессенджеров (src/messengers) — регистрируется в MessengerRegistry сам
        VkMessengerChannel,
      ],
      exports: [
        VkAuthStrategy,
        VkDialogService,
        VkBotService,
        VkMessengerChannel,
      ],
    };
  }
}
