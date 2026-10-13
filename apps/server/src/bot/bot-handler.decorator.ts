import { SetMetadata } from '@nestjs/common';

export const BOT_HANDLER_METADATA = 'bot:handler';

export interface BotHandlerOptions {
  /** Префиксы payload кнопок и ключей ожидания ввода (`wo`, `sw`, …) — раздел 23.4 ТЗ. */
  prefixes: string[];
  /** Команды без слэша, которые ведут в этот обработчик. */
  commands?: string[];
  /** Префиксы payload команды /start (`fr` для `start=fr_<code>`). */
  startPayloads?: string[];
  /** Обработчик только для администратора. */
  admin?: boolean;
}

/** Помечает класс `*.bot.ts` как обработчик бота; BotRouter находит его через DiscoveryService. */
export const BotHandler = (options: BotHandlerOptions) =>
  SetMetadata(BOT_HANDLER_METADATA, options);
