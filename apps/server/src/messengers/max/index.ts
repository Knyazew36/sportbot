/**
 * Публичный API модуля MAX. Снаружи импортировать только отсюда (`@/max`) — внутренняя
 * раскладка файлов может меняться. Подробности подключения — в README.md.
 */
export { MaxIntegrationModule } from './max-integration.module';
export { MaxAppAdapter } from './max-app.adapter';
export type {
  MaxIntegrationOptions,
  MaxLinkButton,
  MaxUserInfo,
  MaxWebSession,
} from './max.types';

export { MaxAuthStrategy } from './auth/max-auth.strategy';
export { MaxBotService } from './bot/max-bot.service';
export type { MaxKeyboardRow } from './bot/max-bot.service';
export { MaxDialogService } from './dialog/max-dialog.service';
export { MaxMessengerChannel } from './messenger/max-messenger.channel';
export { getMaxDialogState, isMaxDialogOpen } from './dialog/max-dialog.state';
export type { MaxDialogState } from './dialog/max-dialog.state';
