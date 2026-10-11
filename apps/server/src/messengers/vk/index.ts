/**
 * Публичный API модуля VK. Снаружи импортировать только отсюда (`@/vk`) — внутренняя раскладка
 * файлов может меняться. Модуль устроен так же, как src/messengers/max и src/messengers/telegram.
 */
export { VkIntegrationModule } from './vk-integration.module';
export { VkAppAdapter } from './vk-app.adapter';
export type {
  VkCallbackContext,
  VkIntegrationOptions,
  VkKeyboard,
  VkKeyboardButton,
  VkLinkButton,
  VkMessageContext,
  VkUserInfo,
  VkWebSession,
} from './vk.types';

export { VkAuthStrategy } from './auth/vk-auth.strategy';
export { VkBotService } from './bot/vk-bot.service';
export { VkDialogService } from './dialog/vk-dialog.service';
export { VkMessengerChannel } from './messenger/vk-messenger.channel';
export { getVkDialogState, isVkDialogOpen } from './dialog/vk-dialog.state';
export type { VkDialogState } from './dialog/vk-dialog.state';
