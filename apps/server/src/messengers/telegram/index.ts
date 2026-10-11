/**
 * Публичный API модуля Telegram. Снаружи импортировать только отсюда (`@/telegram`) — внутренняя
 * раскладка файлов может меняться. Модуль устроен так же, как src/messengers/max (см. README.md там).
 */
export { TelegramIntegrationModule } from './telegram-integration.module';
export { TelegramAppAdapter } from './telegram-app.adapter';
export type {
  TelegramIntegrationOptions,
  TelegramLinkButton,
  TelegramUserInfo,
  TelegramWebSession,
} from './telegram.types';

export { TelegramAuthStrategy } from './auth/telegram-auth.strategy';
export { TelegramBotService } from './bot/telegram-bot.service';
export type { TelegramKeyboardRow } from './bot/telegram-bot.service';
export { TelegramDialogService } from './dialog/telegram-dialog.service';
export { TelegramMessengerChannel } from './messenger/telegram-messenger.channel';
export {
  getTelegramDialogState,
  isTelegramDialogOpen,
} from './dialog/telegram-dialog.state';
export type { TelegramDialogState } from './dialog/telegram-dialog.state';
