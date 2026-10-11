import { DynamicModule, Logger } from '@nestjs/common';

import { MultiAuthGuard } from '@/common/guards/multi-auth.guard';

import { AppMaxAdapter } from './adapters/app-max.adapter';
import { AppMessengersSupportModule } from './adapters/app-messengers-support.module';
import { AppTelegramAdapter } from './adapters/app-telegram.adapter';
import { AppVkAdapter } from './adapters/app-vk.adapter';
import { MaxIntegrationModule } from './max';
import { MAX_LOG_EMOJI } from './max/max.constants';
import { TelegramIntegrationModule } from './telegram';
import { TELEGRAM_LOG_EMOJI } from './telegram/telegram.constants';
import { VkIntegrationModule } from './vk';
import { VK_LOG_EMOJI } from './vk/vk.constants';

const logger = new Logger('📨 Messengers');

/** Имена незаданных переменных — пустая строка в .env тоже считается незаданной. */
const missingEnv = (names: string[]): string[] =>
  names.filter((name) => !process.env[name]?.trim());

/**
 * Мини-приложение Telegram — это тот же фронт, поэтому URL берём из FRONTEND_URL.
 * web_app-кнопка принимает только https: на локальном http://localhost отдаём undefined,
 * и кнопка уходит в фолбэк ?startapp.
 */
const telegramWebAppUrl = (): string | undefined => {
  const url = process.env.FRONTEND_URL?.trim().replace(/\/+$/, '');
  return url?.startsWith('https://') ? url : undefined;
};

/** Необязательное положительное целое из env (id мини-приложения VK и т.п.). */
const optionalPositiveInt = (name: string): number | undefined => {
  const value = Number(process.env[name]?.trim());
  return Number.isInteger(value) && value > 0 ? value : undefined;
};

/**
 * Модули мессенджеров, для которых заданы env-переменные. Мессенджер без переменных не подключается:
 * пишем об этом в лог и стартуем дальше — его бот, вход/привязка и уведомления просто недоступны
 * (канал пропадает из MessengerRegistry, стратегия авторизации — из MultiAuthGuard).
 *
 * Вызывать в imports AppModule ПОСЛЕ ConfigModule.forRoot: он синхронно загружает .env в process.env.
 */
export function messengerIntegrations(): DynamicModule[] {
  const modules: DynamicModule[] = [];
  const enabled: string[] = [];

  const maxMissing = missingEnv(['MAX_BOT_TOKEN', 'MAX_BOT_NAME']);
  if (maxMissing.length) {
    logger.warn(
      `${MAX_LOG_EMOJI} ❌ MAX выключен — не заданы ${maxMissing.join(', ')}: бот, вход через MAX и уведомления в MAX недоступны`,
    );
  } else {
    // Всё про MAX (бот, initData, вход/привязка через бота, уведомления) — src/messengers/max, см. README.md там.
    // Проектная логика (сессии, слияние аккаунтов, свои кнопки) — AppMaxAdapter.
    modules.push(
      MaxIntegrationModule.forRoot({
        token: process.env.MAX_BOT_TOKEN!,
        botName: process.env.MAX_BOT_NAME!,
        adapter: AppMaxAdapter,
        authGuard: MultiAuthGuard,
        imports: [AppMessengersSupportModule],
      }),
    );
    logger.log(
      `${MAX_LOG_EMOJI} ✅ MAX подключён: бот @${process.env.MAX_BOT_NAME}`,
    );
    enabled.push(`${MAX_LOG_EMOJI} MAX`);
  }

  const telegramMissing = missingEnv(['TG_BOT_TOKEN', 'TG_BOT_NAME']);
  if (telegramMissing.length) {
    logger.warn(
      `${TELEGRAM_LOG_EMOJI} ❌ Telegram выключен — не заданы ${telegramMissing.join(', ')}: бот, вход через Telegram и уведомления в Telegram недоступны`,
    );
  } else {
    // Всё про Telegram — src/messengers/telegram, устроен как src/messengers/max. Проектная логика — AppTelegramAdapter.
    modules.push(
      TelegramIntegrationModule.forRoot({
        token: process.env.TG_BOT_TOKEN!,
        botName: process.env.TG_BOT_NAME!,
        webAppUrl: telegramWebAppUrl(),
        adapter: AppTelegramAdapter,
        authGuard: MultiAuthGuard,
        imports: [AppMessengersSupportModule],
      }),
    );
    logger.log(
      `${TELEGRAM_LOG_EMOJI} ✅ Telegram подключён: бот @${process.env.TG_BOT_NAME}`,
    );
    enabled.push(`${TELEGRAM_LOG_EMOJI} Telegram`);
  }

  const vkMissing = missingEnv(['VK_BOT_TOKEN', 'VK_GROUP_ID']);
  const vkGroupId = optionalPositiveInt('VK_GROUP_ID');
  if (vkMissing.length || !vkGroupId) {
    logger.warn(
      `${VK_LOG_EMOJI} ❌ VK выключен — ${
        vkMissing.length
          ? `не заданы ${vkMissing.join(', ')}`
          : 'VK_GROUP_ID не положительное число'
      }: бот сообщества, вход через VK и уведомления в VK недоступны`,
    );
  } else {
    // Всё про VK — src/messengers/vk, устроен как src/messengers/telegram. Проектная логика — AppVkAdapter.
    // VK_APP_ID / VK_APP_SECRET необязательны: без них не работает только мини-приложение VK
    const appSecret = process.env.VK_APP_SECRET?.trim() || undefined;
    modules.push(
      VkIntegrationModule.forRoot({
        token: process.env.VK_BOT_TOKEN!,
        groupId: vkGroupId,
        appId: optionalPositiveInt('VK_APP_ID'),
        appSecret,
        webAppUrl:
          process.env.FRONTEND_URL?.trim().replace(/\/+$/, '') || undefined,
        adapter: AppVkAdapter,
        authGuard: MultiAuthGuard,
        imports: [AppMessengersSupportModule],
      }),
    );
    logger.log(
      `${VK_LOG_EMOJI} ✅ VK подключён: сообщество club${vkGroupId}${appSecret ? '' : ' (без мини-приложения: не задан VK_APP_SECRET)'}`,
    );
    enabled.push(`${VK_LOG_EMOJI} VK`);
  }

  if (enabled.length) {
    logger.log(`🚀 Запущены мессенджеры: ${enabled.join(', ')}`);
  } else {
    logger.warn(
      '🔕 Ни один мессенджер не подключён — уведомления уйдут только в email/приложение',
    );
  }

  return modules;
}
