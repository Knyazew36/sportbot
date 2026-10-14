import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { BotRouter } from './bot-router.service';
import { BotSender } from './bot-sender.service';
import { BotSessionService } from './bot-session.service';
import { MenuBot } from './menu.bot';
import { SportAccountService } from './sport-account.service';

/**
 * Ядро бота: роутер, сессии диалога, очередь отправки, главное меню.
 * Глобальный — адаптеры мессенджеров и модули фич берут роутер и отправку без импорта.
 */
@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [
    BotRouter,
    BotSender,
    BotSessionService,
    SportAccountService,
    MenuBot,
  ],
  exports: [BotRouter, BotSender, BotSessionService, SportAccountService],
})
export class BotModule {}
