/** Публичный API общего слоя мессенджеров — импортировать только отсюда (`@/messengers`). */
export { MessengersModule } from './messengers.module';
export type { MessengersModuleOptions } from './messengers.module';
export { MessengerRegistry } from './messenger.registry';
export { MessengerUserStore } from './messenger.types';
export {
  italic,
  link,
  plainText,
  separateItalic,
  strike,
  textSpans,
  toHtml,
} from './messenger-format';
export type {
  MessengerButton,
  MessengerCallbackMessage,
  MessengerChannel,
  MessengerChannelKey,
  MessengerMessage,
  MessengerSendResult,
  MessengerUser,
  MessengerUserPatch,
} from './messenger.types';
